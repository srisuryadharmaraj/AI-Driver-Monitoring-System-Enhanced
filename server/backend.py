"""
FastAPI Backend · AI Driver Behavior Monitoring System
──────────────────────────────────────────────────────
REST API + WebSocket endpoints consumed by the React frontend.
Includes obstacle/collision detection and alarm signalling.
"""

from __future__ import annotations

import asyncio
import base64
import json
import os
import sys
import uuid
from pathlib import Path
from typing import Optional

import cv2
import numpy as np
from fastapi import FastAPI, File, UploadFile, WebSocket, WebSocketDisconnect, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, HTMLResponse
from fastapi.staticfiles import StaticFiles

# ── Ensure project root on path ─────────────────────────────────────────────
PROJECT_ROOT = Path(__file__).resolve().parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from video_mode import VideoProcessor
from live_mode import LiveProcessor

# ── New Platform Routers & Services ─────────────────────────────────────────
try:
    from database.db import init_db
    from services.seed_data import seed_database
    from routers.drivers import router as drivers_router
    from routers.journeys import router as journeys_router, record_journey, JourneyRecordCreate
    from routers.analytics import router as analytics_router
    from routers.recruitment import router as recruitment_router
    
    init_db()
    seed_database()
except Exception as _e:
    print(f"[Platform Router Import Warning] {_e}")

# ── Paths ────────────────────────────────────────────────────────────────────
PREDICTOR = str(PROJECT_ROOT / "models" / "shape_predictor_68_face_landmarks.dat")
YOLO_MODEL = str(PROJECT_ROOT / "models" / "yolov8n.pt")
FACE_LANDMARKER = str(PROJECT_ROOT / "models" / "face_landmarker.task")
UPLOAD_DIR = PROJECT_ROOT / "uploads"
UPLOAD_DIR.mkdir(exist_ok=True)

# Client build directory (one level up → ../client/dist)
CLIENT_BUILD = PROJECT_ROOT.parent / "client" / "dist"

# ── FastAPI App ──────────────────────────────────────────────────────────────
app = FastAPI(title="Driver AI Monitor", version="3.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include New Platform Routers
try:
    app.include_router(drivers_router)
    app.include_router(journeys_router)
    app.include_router(analytics_router)
    app.include_router(recruitment_router)
except Exception as _e:
    print(f"[Router Registration Warning] {_e}")

# Serve React build assets if they exist
if CLIENT_BUILD.exists() and (CLIENT_BUILD / "assets").exists():
    app.mount("/assets", StaticFiles(directory=str(CLIENT_BUILD / "assets")), name="assets")


# ── Health ───────────────────────────────────────────────────────────────────
@app.get("/api/health")
async def health():
    return {"status": "ok", "version": "3.0.0"}


# ══════════════════════════════════════════════════════════════════════════════
#  VIDEO UPLOAD + PROCESSING
# ══════════════════════════════════════════════════════════════════════════════

@app.post("/api/upload")
async def upload_video(file: UploadFile = File(...)):
    """Save uploaded video and return a job_id for processing."""
    ext = Path(file.filename or "video.mp4").suffix
    job_id = uuid.uuid4().hex[:12]
    dest = UPLOAD_DIR / f"{job_id}{ext}"
    content = await file.read()
    dest.write_bytes(content)
    return {"job_id": job_id, "filename": file.filename, "path": str(dest)}


@app.websocket("/ws/process/{job_id}")
async def ws_process_video(websocket: WebSocket, job_id: str,
                           speed_limit: float = Query(80.0),
                           skip_frames: int = Query(2),
                           ear_threshold: float = Query(0.25)):
    """
    WebSocket: process a video frame-by-frame and stream JSON results
    including obstacle detection and alarm events.
    """
    await websocket.accept()

    # Find video file
    video_file = None
    for f in UPLOAD_DIR.iterdir():
        if f.stem == job_id:
            video_file = f
            break

    if video_file is None:
        await websocket.send_json({"error": f"Video {job_id} not found"})
        await websocket.close()
        return

    processor = VideoProcessor(
        predictor_path=PREDICTOR,
        yolo_path=YOLO_MODEL,
        face_landmarker_path=FACE_LANDMARKER,
        speed_limit=speed_limit,
        skip_frames=skip_frames,
    )
    processor.fatigue_det.ear_threshold = ear_threshold

    cap = cv2.VideoCapture(str(video_file))
    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    fps = cap.get(cv2.CAP_PROP_FPS) or 30.0
    cap.release()

    await websocket.send_json({
        "type": "meta",
        "total_frames": total_frames,
        "fps": fps,
        "duration_sec": round(total_frames / fps, 2),
    })

    speeds, risks, ears, dangers = [], [], [], []
    fatigue_frames = 0
    distraction_frames = 0
    overspeed_events = 0
    collision_warnings = 0
    obstacle_frames = 0
    max_speed = 0.0
    total_alarms = 0
    plates = []
    alerts = []

    try:
        for bundle in processor.stream(str(video_file)):
            frame_b64 = ""
            if bundle.annotated_frame is not None:
                _, buf = cv2.imencode(".jpg", bundle.annotated_frame,
                                      [cv2.IMWRITE_JPEG_QUALITY, 60])
                frame_b64 = base64.b64encode(buf).decode("ascii")

            # Accumulate
            if bundle.fatigue.fatigue:
                fatigue_frames += 1
            if bundle.distraction.distraction:
                distraction_frames += 1
            if bundle.speed.speed_kmph > max_speed:
                max_speed = bundle.speed.speed_kmph
            if bundle.plate.overspeed:
                overspeed_events += 1
            if bundle.obstacle.collision_risk:
                collision_warnings += 1
            if bundle.obstacle.obstacle_detected:
                obstacle_frames += 1
            if bundle.risk.alarm:
                total_alarms += 1
            if bundle.plate.plate_text:
                plates.append({"text": bundle.plate.plate_text,
                               "speed": bundle.plate.speed,
                               "time": bundle.timestamp_sec})
            if bundle.risk.alarm:
                alerts.append({"frame": bundle.frame_idx,
                               "time": bundle.timestamp_sec,
                               "score": bundle.risk.score,
                               "reasons": bundle.risk.alarm_labels})

            speeds.append(bundle.speed.speed_kmph)
            risks.append(bundle.risk.score)
            ears.append(bundle.fatigue.ear)
            dangers.append(bundle.obstacle.danger_score)

            await websocket.send_json({
                "type": "frame",
                "frame_idx": bundle.frame_idx,
                "total_frames": total_frames,
                "timestamp_sec": bundle.timestamp_sec,
                "image": frame_b64,
                # Driver state
                "fatigue": bundle.fatigue.fatigue,
                "ear": bundle.fatigue.ear,
                "distraction": bundle.distraction.distraction,
                "yaw": bundle.distraction.yaw,
                "pitch": bundle.distraction.pitch,
                "phone": bundle.distraction.phone,
                # Speed & road
                "speed_kmph": bundle.speed.speed_kmph,
                "overspeed": bundle.plate.overspeed,
                "plate_text": bundle.plate.plate_text,
                # Obstacle
                "obstacle_detected": bundle.obstacle.obstacle_detected,
                "obstacle_label": bundle.obstacle.obstacle_label,
                "obstacle_count": bundle.obstacle.obstacle_count,
                "approaching": bundle.obstacle.approaching,
                "collision_risk": bundle.obstacle.collision_risk,
                "danger_score": bundle.obstacle.danger_score,
                # Risk & alarm
                "risk_score": bundle.risk.score,
                "risk_level": bundle.risk.level.value,
                "alarm": bundle.risk.alarm,
                "alarm_reasons": bundle.risk.alarm_labels,
            })

            await asyncio.sleep(0)

        # Final summary
        avg_risk = round(float(np.mean(risks)) if risks else 0, 3)
        max_risk = round(float(np.max(risks)) if risks else 0, 3)
        await websocket.send_json({
            "type": "summary",
            "total_frames": total_frames,
            "duration_sec": round(total_frames / fps, 2),
            "fps": fps,
            "fatigue_frames": fatigue_frames,
            "distraction_frames": distraction_frames,
            "max_speed": round(max_speed, 1),
            "overspeed_events": overspeed_events,
            "collision_warnings": collision_warnings,
            "obstacle_frames": obstacle_frames,
            "total_alarms": total_alarms,
            "plates_detected": plates,
            "avg_risk": avg_risk,
            "max_risk": max_risk,
            "speed_timeline": speeds,
            "risk_timeline": risks,
            "ear_timeline": ears,
            "danger_timeline": dangers,
            "alert_moments": alerts,
        })

        # Auto-record journey into platform database (fail-safe)
        try:
            from database.db import query_db
            first_driver = query_db("SELECT driver_id FROM drivers LIMIT 1", one=True)
            if first_driver:
                dur_min = max(1, int(round((total_frames / fps) / 60)))
                record_journey(JourneyRecordCreate(
                    driver_id=first_driver["driver_id"],
                    monitoring_mode="Video",
                    duration_min=dur_min,
                    fatigue_events=fatigue_frames // 30,
                    distraction_events=distraction_frames // 30,
                    lane_events=0,
                    obstacle_warnings=collision_warnings,
                    overspeed_events=overspeed_events,
                    safety_warnings=total_alarms,
                    average_risk=avg_risk,
                    maximum_risk=max_risk
                ))
        except Exception as _je:
            print(f"[Auto-Record Journey Warning] {_je}")

    except WebSocketDisconnect:
        pass
    finally:
        await websocket.close()


# ══════════════════════════════════════════════════════════════════════════════
#  LIVE CAMERA (WebSocket)
# ══════════════════════════════════════════════════════════════════════════════

_live: Optional[LiveProcessor] = None


@app.websocket("/ws/live")
async def ws_live(websocket: WebSocket,
                  speed_limit: float = Query(80.0),
                  ear_threshold: float = Query(0.25)):
    """
    WebSocket for live camera mode.
    Streams annotated frames + metrics + alarm events.
    Client sends {"action": "stop"} to end.
    """
    global _live
    await websocket.accept()

    _live = LiveProcessor(
        predictor_path=PREDICTOR,
        yolo_path=YOLO_MODEL,
        face_landmarker_path=FACE_LANDMARKER,
        speed_limit=speed_limit,
    )
    _live.fatigue_det.ear_threshold = ear_threshold

    if not _live.open_camera():
        await websocket.send_json({"error": "Cannot open webcam"})
        await websocket.close()
        _live = None
        return

    try:
        while True:
            # Check for stop messages (non-blocking)
            try:
                msg = await asyncio.wait_for(websocket.receive_text(), timeout=0.001)
                data = json.loads(msg)
                if data.get("action") == "stop":
                    break
            except (asyncio.TimeoutError, Exception):
                pass

            state = _live.tick()
            if state is None:
                break

            frame_b64 = ""
            if state.annotated_frame is not None:
                _, buf = cv2.imencode(".jpg", state.annotated_frame,
                                      [cv2.IMWRITE_JPEG_QUALITY, 65])
                frame_b64 = base64.b64encode(buf).decode("ascii")

            await websocket.send_json({
                "type": "live_frame",
                "frame_count": state.frame_count,
                "image": frame_b64,
                # Driver state
                "fatigue": state.fatigue.fatigue,
                "ear": state.fatigue.ear,
                "distraction": state.distraction.distraction,
                "yaw": state.distraction.yaw,
                "pitch": state.distraction.pitch,
                # Speed & road
                "speed_kmph": state.speed.speed_kmph,
                "overspeed": state.plate.overspeed,
                "plate_text": state.plate.plate_text,
                # Obstacle
                "obstacle_detected": state.obstacle.obstacle_detected,
                "obstacle_label": state.obstacle.obstacle_label,
                "obstacle_count": state.obstacle.obstacle_count,
                "approaching": state.obstacle.approaching,
                "collision_risk": state.obstacle.collision_risk,
                "danger_score": state.obstacle.danger_score,
                # Risk & alarm
                "risk_score": state.risk.score,
                "risk_level": state.risk.level.value,
                "alarm": state.alarm_fired,
                "alarm_reasons": state.alarm_reasons,
                # Rolling histories
                "speed_history": state.speed_history[-60:],
                "risk_history": state.risk_history[-60:],
                "ear_history": state.ear_history[-60:],
                "danger_history": state.danger_history[-60:],
            })

            await asyncio.sleep(0.01)

    except WebSocketDisconnect:
        pass
    finally:
        if _live:
            _live.close_camera()
            _live = None


# ── Serve React index.html as fallback ───────────────────────────────────────
@app.get("/{full_path:path}")
async def serve_react(full_path: str):
    """Serve the React SPA for any non-API route."""
    index = CLIENT_BUILD / "index.html"
    if index.exists():
        return HTMLResponse(index.read_text())
    return JSONResponse(
        {"message": "Frontend not built. Run: cd client && npm run build"},
        status_code=404,
    )


# ── Run ──────────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend:app", host="0.0.0.0", port=8000, reload=True)
