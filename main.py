import os
import sys
import subprocess

def main():
    # Resolve the absolute path of the streamlit app script and the virtual environment executable
    current_dir = os.path.dirname(os.path.abspath(__file__))
    script_path = os.path.join(current_dir, "soil_monitor.py")
    streamlit_exe = os.path.join(current_dir, ".venv", "Scripts", "streamlit.exe")
    
    if not os.path.exists(streamlit_exe):
        streamlit_exe = "streamlit"
        
    print(f"Launching Soil Moisture Telemetry Controller via Streamlit...")
    cmd = [streamlit_exe, "run", script_path]
    
    try:
        subprocess.run(cmd)
    except KeyboardInterrupt:
        print("\nDashboard execution stopped.")

if __name__ == "__main__":
    main()
