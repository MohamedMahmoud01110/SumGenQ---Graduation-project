"""
Simple Mock FastAPI server for testing the frontend
This provides basic endpoints that return mock data
"""

from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import time
import uuid
from typing import Optional

app = FastAPI(
    title="Mock Book Summarization & Chatbot",
    description="Mock server for frontend testing",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
async def health_check():
    """System health check."""
    return JSONResponse({
        "status": "healthy",
        "components_healthy": True,
        "active_sessions": 0,
        "stored_documents": 0,
        "stored_summaries": 0,
        "timestamp": time.time()
    })

@app.get("/config")
async def get_config():
    """Get system configuration."""
    return JSONResponse({
        "model_config": {
            "gemini_model": "gemini-pro",
            "temperature": 0.7,
            "max_tokens": 1000,
            "chunk_size": 1000,
            "max_file_size_mb": 25,
            "supported_formats": ["pdf", "docx", "txt"]
        },
        "system_info": {
            "version": "1.0.0",
            "features": ["Mock document processing", "Mock summarization", "Mock chatbot"]
        }
    })

@app.post("/summarize-file")
async def mock_summarize_file(
    file: UploadFile = File(...),
    instruction: str = Form(default="")
):
    """Mock file summarization endpoint."""

    if not file.filename:
        raise HTTPException(status_code=400, detail="No file provided")

    # Simulate processing time
    time.sleep(1)

    return JSONResponse({
        "status": "success",
        "summary": f"This is a mock summary of {file.filename}. The document appears to be about various topics and contains important information that has been summarized for easy reading. {instruction if instruction else ''}",
        "document_id": str(uuid.uuid4()),
        "filename": file.filename,
        "processing_time": 1.0,
        "message": "Document summarized successfully (mock)"
    })

@app.post("/analyze-document")
async def mock_analyze_document(file: UploadFile = File(...)):
    """Mock document analysis endpoint."""

    if not file.filename:
        raise HTTPException(status_code=400, detail="No file provided")

    # Simulate processing time
    time.sleep(0.5)

    return JSONResponse({
        "status": "success",
        "analysis": {
            "file_metadata": {
                "file_type": file.filename.split('.')[-1].lower(),
                "file_size": 1024 * 1024,  # Mock 1MB
                "filename": file.filename
            },
            "document_metadata": {
                "word_count": 1500,
                "character_count": 8500,
                "sentence_count": 75,
                "estimated_reading_time_minutes": 5,
                "chunks_needed": 3
            },
            "text_preview": "This is a mock text preview of the document content. It shows the first few sentences to give users an idea of what the document contains...",
            "processing_recommendations": {
                "complexity": "Medium",
                "chunking": "Recommended",
                "time_estimate": "2-3 minutes"
            }
        },
        "message": "Document analysis completed successfully (mock)"
    })

@app.post("/chat")
async def mock_chat(
    file: UploadFile = File(...),
    question: str = Form(...)
):
    """Mock chat endpoint."""

    if not file.filename:
        raise HTTPException(status_code=400, detail="No file provided")

    if not question.strip():
        raise HTTPException(status_code=400, detail="Question cannot be empty")

    # Simulate processing time
    time.sleep(1)

    return JSONResponse({
        "status": "success",
        "answer": f"This is a mock answer to your question: '{question}'. Based on the document '{file.filename}', I can provide this response. The document contains relevant information that addresses your query.",
        "session_id": str(uuid.uuid4()),
        "document_id": str(uuid.uuid4()),
        "processing_time": 1.0,
        "message": "Question answered successfully (mock)"
    })

@app.post("/process-url")
async def mock_process_url(request: dict):
    """Mock URL processing endpoint."""

    url = request.get("url", "")
    if not url:
        raise HTTPException(status_code=400, detail="URL is required")

    # Simulate processing time
    time.sleep(1)

    return JSONResponse({
        "status": "success",
        "document_id": str(uuid.uuid4()),
        "session_id": str(uuid.uuid4()),
        "url": url,
        "title": f"Document from {url}",
        "word_count": 1200,
        "processing_time": 1.0,
        "summary_preview": f"This is a mock summary of the content from {url}. The document has been processed and summarized for easy reading...",
        "message": "URL processed successfully (mock)"
    })

if __name__ == "__main__":
    import uvicorn
    print("Starting Mock Server on http://127.0.0.1:8002")
    print("This is a mock server for frontend testing only!")
    uvicorn.run(app, host="127.0.0.1", port=8002)
