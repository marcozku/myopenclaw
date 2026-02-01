#!/bin/bash

# Enhanced Skills Installation Script for OpenClaw
# This script pre-installs additional capabilities for GLM-4.7

set -e

echo "🚀 Installing enhanced skills and tools..."

# 创建技能目录
mkdir -p /data/skills/custom
mkdir -p /data/tools/bin

# 安装额外的 Python 工具
echo "📦 Installing additional Python packages..."
pip3 install --no-cache-dir \
    youtube-dl \
    pytube \
    google-api-python-client \
    tweepy \
    discord.py \
    flask \
    fastapi \
    uvicorn

# 安装额外的 Node.js 包
echo "📦 Installing additional Node.js packages..."
cd /app
npm install --save \
    @discordjs/voice \
    @discordjs/opus \
    ytdl-core \
    play-dl \
    cheerio \
    puppeteer-core \
    telegraf

# 下载并安装常用工具
echo "🔧 Installing additional CLI tools..."

# 安装 yt-dlp (YouTube 下载)
curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o /data/tools/bin/yt-dlp
chmod +x /data/tools/bin/yt-dlp

# 将工具添加到 PATH
export PATH="/data/tools/bin:$PATH"

# 创建技能配置文件
cat > /data/skills/custom/skills.json << 'EOF'
{
  "version": "1.0.0",
  "skills": {
    "multimedia": {
      "enabled": true,
      "tools": ["ffmpeg", "imagemagick", "yt-dlp"],
      "capabilities": [
        "video_conversion",
        "audio_extraction",
        "image_processing",
        "youtube_download"
      ]
    },
    "data_processing": {
      "enabled": true,
      "tools": ["pandas", "numpy", "openpyxl"],
      "capabilities": [
        "csv_processing",
        "excel_manipulation",
        "data_analysis"
      ]
    },
    "web_scraping": {
      "enabled": true,
      "tools": ["beautifulsoup4", "scrapy", "cheerio"],
      "capabilities": [
        "html_parsing",
        "web_crawling",
        "data_extraction"
      ]
    },
    "ai_processing": {
      "enabled": true,
      "tools": ["torch", "transformers"],
      "capabilities": [
        "text_generation",
        "sentiment_analysis",
        "translation"
      ]
    }
  }
}
EOF

# 创建工具使用示例脚本
mkdir -p /data/workspace/examples

cat > /data/workspace/examples/video_converter.py << 'EOF'
#!/usr/bin/env python3
"""
视频转换工具
用法: python video_converter.py input.mp4 output.mp3
"""
import sys
from pydub import AudioSegment

def convert_video_to_audio(input_file, output_file):
    audio = AudioSegment.from_file(input_file)
    audio.export(output_file, format="mp3")
    print(f"✅ 转换完成: {output_file}")

if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("用法: python video_converter.py <输入文件> <输出文件>")
        sys.exit(1)
    convert_video_to_audio(sys.argv[1], sys.argv[2])
EOF

cat > /data/workspace/examples/image_processor.py << 'EOF'
#!/usr/bin/env python3
"""
图像处理工具
用法: python image_processor.py input.jpg output.jpg --resize 800x600
"""
from PIL import Image
import sys

def resize_image(input_path, output_path, size):
    img = Image.open(input_path)
    img_resized = img.resize(size)
    img_resized.save(output_path)
    print(f"✅ 图片已调整大小: {output_path}")

if __name__ == "__main__":
    if len(sys.argv) >= 3:
        resize_image(sys.argv[1], sys.argv[2], (800, 600))
EOF

chmod +x /data/workspace/examples/*.py

echo "✅ Skills installation completed!"
echo "📁 Skills location: /data/skills/custom"
echo "🛠️  Tools location: /data/tools/bin"
echo "📚 Examples location: /data/workspace/examples"
