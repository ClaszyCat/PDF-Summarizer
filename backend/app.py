import os
import sys
import io
from flask import Flask, request, jsonify
from flask_cors import CORS
import google.generativeai as genai
from PyPDF2 import PdfReader
from dotenv import load_dotenv
import requests
from pathlib import Path

# Load environment variables
load_dotenv()

app = Flask(__name__)
CORS(app)  # Enable CORS for Next.js frontend

# Configure Gemini API
API_KEY = os.getenv("GOOGLE_GEMINI_KEY")
if not API_KEY:
    print("❌ Error: GOOGLE_GEMINI_KEY not found in .env file", file=sys.stderr)
    sys.exit(1)

genai.configure(api_key=API_KEY)

def get_model_with_config(max_tokens=8192, temperature=0.7):
    """Create a model with custom configuration"""
    return genai.GenerativeModel(
        "gemini-2.0-flash",
        generation_config={
            "temperature": temperature,
            "top_p": 0.95,
            "max_output_tokens": max_tokens,
        }
    )

def extract_text_from_pdf(file_or_bytes):
    """
    Extract text from PDF file or bytes
    
    Args:
        file_or_bytes: File path, file object, or bytes
        
    Returns:
        str: Extracted text
    """
    try:
        reader = PdfReader(file_or_bytes)
        text = ""
        for page in reader.pages:
            page_text = page.extract_text()
            if page_text:
                text += page_text + "\n"
        return text
    except Exception as e:
        raise Exception(f"Error reading PDF: {str(e)}")

def download_pdf_from_url(url):
    """Download PDF from URL and return bytes"""
    try:
        response = requests.get(url, timeout=30)
        response.raise_for_status()
        
        # Check if it's actually a PDF
        content_type = response.headers.get('content-type', '')
        if 'pdf' not in content_type.lower():
            # Try anyway, might still be a PDF
            pass
        
        return io.BytesIO(response.content)
    except Exception as e:
        raise Exception(f"Error downloading PDF: {str(e)}")

def create_summary_prompt(text, max_chars=50000, summary_style="comprehensive", output_language="auto"):
    """
    Create optimized prompt based on token limits and language preference
    
    Args:
        text: Text to summarize
        max_chars: Maximum characters to include
        summary_style: Style of summary (comprehensive, concise, bullet)
        output_language: Output language (auto, english, indonesian)
    """
    # Truncate if needed
    if len(text) > max_chars:
        text = text[:max_chars]
    
    # Language instruction based on preference
    language_instruction = ""
    if output_language == "english":
        language_instruction = "IMPORTANT: Provide the summary in ENGLISH, regardless of the input document's language."
    elif output_language == "indonesian":
        language_instruction = "IMPORTANT: Provide the summary in INDONESIAN (Bahasa Indonesia), regardless of the input document's language."
    else:  # auto
        language_instruction = "Provide the summary in the same language as the input document."
    
    # Different prompt templates based on style
    if summary_style == "concise":
        prompt = f"""
Provide a CONCISE summary of this document.

{language_instruction}

Requirements:
- Keep it brief but informative
- Focus on main points only
- Use clear, simple language
- Maximum 3-4 paragraphs

Document:
{text}
"""
    elif summary_style == "bullet":
        prompt = f"""
Summarize this document using bullet points.

{language_instruction}

Requirements:
- Use bullet point format
- Highlight key points
- Keep each point concise
- Organize logically

Document:
{text}
"""
    else:  # comprehensive
        prompt = f"""
Provide a COMPREHENSIVE yet CONCISE summary of this document.

{language_instruction}

Requirements:
- Use clear, well-structured paragraphs
- Highlight all key ideas and main points
- Include important details and context
- Maintain readability and coherence
- Be thorough but avoid unnecessary verbosity

Document:
{text}
"""
    
    return prompt

def summarize_text(text, max_tokens=8192, temperature=0.7, summary_style="comprehensive", output_language="auto"):
    """
    Generate summary with customizable parameters
    
    Args:
        text: Text to summarize
        max_tokens: Maximum output tokens
        temperature: Model temperature (0.0-1.0)
        summary_style: Style of summary
        output_language: Output language (auto, english, indonesian)
        
    Returns:
        str: Generated summary
    """
    # Create model with specified config
    model = get_model_with_config(max_tokens, temperature)
    
    # Create optimized prompt with language preference
    prompt = create_summary_prompt(text, summary_style=summary_style, output_language=output_language)
    
    try:
        response = model.generate_content(prompt)
        
        if not response or not response.text:
            raise Exception("No response generated from API")
        
        return response.text
    except Exception as e:
        raise Exception(f"Error generating summary: {str(e)}")

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({"status": "ok", "message": "Backend is running"})

@app.route('/api/summarize', methods=['POST'])
def summarize():
    """
    Main endpoint to summarize PDF
    Accepts: file upload or PDF URL
    """
    try:
        # Get parameters
        max_tokens = int(request.form.get('max_tokens', 8192))
        temperature = float(request.form.get('temperature', 0.7))
        summary_style = request.form.get('summary_style', 'comprehensive')
        output_language = request.form.get('output_language', 'auto')
        pdf_url = request.form.get('pdf_url', '')
        
        # Validate parameters
        if max_tokens < 256 or max_tokens > 8192:
            return jsonify({"error": "max_tokens must be between 256 and 8192"}), 400
        
        if temperature < 0.0 or temperature > 1.0:
            return jsonify({"error": "temperature must be between 0.0 and 1.0"}), 400
        
        if output_language not in ['auto', 'english', 'indonesian']:
            return jsonify({"error": "output_language must be 'auto', 'english', or 'indonesian'"}), 400
        
        # Get PDF content
        pdf_text = None
        
        # Check if URL is provided
        if pdf_url:
            print(f"📥 Downloading PDF from URL: {pdf_url}")
            pdf_bytes = download_pdf_from_url(pdf_url)
            pdf_text = extract_text_from_pdf(pdf_bytes)
        
        # Check if file is uploaded
        elif 'file' in request.files:
            file = request.files['file']
            if file.filename == '':
                return jsonify({"error": "No file selected"}), 400
            
            if not file.filename.lower().endswith('.pdf'):
                return jsonify({"error": "File must be a PDF"}), 400
            
            print(f"📄 Processing uploaded file: {file.filename}")
            pdf_text = extract_text_from_pdf(file)
        
        else:
            return jsonify({"error": "No PDF file or URL provided"}), 400
        
        # Check if text was extracted
        if not pdf_text or not pdf_text.strip():
            return jsonify({"error": "Could not extract text from PDF"}), 400
        
        # Generate summary
        print(f"🤖 Generating summary (max_tokens={max_tokens}, style={summary_style}, language={output_language})...")
        summary = summarize_text(
            pdf_text,
            max_tokens=max_tokens,
            temperature=temperature,
            summary_style=summary_style,
            output_language=output_language
        )
        
        return jsonify({
            "success": True,
            "summary": summary,
            "metadata": {
                "text_length": len(pdf_text),
                "max_tokens": max_tokens,
                "temperature": temperature,
                "summary_style": summary_style,
                "output_language": output_language
            }
        })
    
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    print("🚀 Starting PDF Summarizer Backend...")
    print("📍 Running on http://localhost:5000")
    app.run(debug=True, port=5000)
