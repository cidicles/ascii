import cv2
import os
import numpy as np
from PIL import Image

# Configuration
VIDEO_PATH = "fifth_element.mp4"
OUTPUT_DIR = "ascii_frames"
FRAME_INTERVAL = 1
ASCII_WIDTH = 300  # High-resolution ASCII
SCALE_FACTOR = 0.5  # Improves aspect ratio accuracy

# Enhanced ASCII character set (even brightness transitions)
ASCII_CHARS = "@#&$%8WMXGQ0OZmwqpdbkhao*+=-:. "  # Dark to light

# ANSI TrueColor Mapping Function
def pixel_to_ansi(pixel):
    """Convert grayscale pixel (0-255) to a TrueColor ANSI sequence."""
    r = g = b = int(pixel)  # Map grayscale to RGB
    return f"\033[38;2;{r};{g};{b}m"

# Ensure output directory exists
os.makedirs(OUTPUT_DIR, exist_ok=True)

def resize_frame(frame, target_width):
    """Resize frame while maintaining aspect ratio."""
    height, width = frame.shape[:2]
    if width == 0 or height == 0:
        print("[ERROR] Invalid frame size.")
        return None  
    aspect_ratio = height / width
    target_height = max(1, int(target_width * aspect_ratio * SCALE_FACTOR))
    return cv2.resize(frame, (target_width, target_height), interpolation=cv2.INTER_AREA)

def enhance_contrast(frame):
    """Improve contrast dynamically using CLAHE."""
    clahe = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8,8))
    return clahe.apply(frame)

def reduce_noise(frame):
    """Apply median blur to reduce noise but keep sharp edges."""
    return cv2.medianBlur(frame, 3)

def image_to_colored_ascii(image):
    """Convert a grayscale image to high-quality colored ASCII."""
    pixels = np.array(image)
    ascii_str = ""
    num_chars = len(ASCII_CHARS) - 1  

    for row in pixels:
        for pixel in row:
            ascii_char = ASCII_CHARS[min(int(pixel / 255 * num_chars), num_chars)]
            color = pixel_to_ansi(pixel)  # Convert pixel brightness to ANSI TrueColor
            ascii_str += f"{color}{ascii_char}"
        ascii_str += "\n"

    return ascii_str + "\033[0m"  # Reset ANSI color at the end

def video_to_ascii():
    cap = cv2.VideoCapture(VIDEO_PATH)
    if not cap.isOpened():
        print("[ERROR] Could not open video file.")
        return

    frame_count = 0
    saved_count = 0
    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))

    print(f"[INFO] Video loaded: {total_frames} frames detected.")

    while cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            print("[INFO] End of video or read error, stopping conversion.")
            break

        if frame_count % FRAME_INTERVAL == 0:
            print(f"[INFO] Processing frame {frame_count}...")

            frame = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
            frame = enhance_contrast(frame)  # Dynamic contrast adjustment
            frame = reduce_noise(frame)  # Noise reduction for smooth ASCII

            resized_frame = resize_frame(frame, ASCII_WIDTH)
            if resized_frame is None or resized_frame.size == 0:
                print(f"[WARNING] Skipping frame {frame_count} due to resizing error.")
                continue

            pil_image = Image.fromarray(resized_frame)
            ascii_frame = image_to_colored_ascii(pil_image)

            frame_filename = f"{OUTPUT_DIR}/frame_{saved_count:04d}.txt"
            with open(frame_filename, "w", encoding="utf-8") as f:
                f.write(ascii_frame)

            print(f"[SUCCESS] Saved ASCII frame {saved_count} -> {frame_filename}")
            saved_count += 1

        frame_count += 1

    cap.release()
    print("[INFO] ASCII frame conversion complete!")

if __name__ == "__main__":
    video_to_ascii()
