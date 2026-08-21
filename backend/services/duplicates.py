import os
import re
from collections import defaultdict

def scan_for_duplicates(directory_path: str):
    duplicates_map = defaultdict(list)
    
    for root, _, files in os.walk(directory_path):
        for file in files:
            if file.lower().endswith(('.mp3', '.mp4')):
                full_path = os.path.join(root, file).replace('\\', '/')
                size = os.path.getsize(full_path)
                
                # clean title: remove extensions, copy markers like (1), etc.
                base_name = os.path.splitext(file)[0]
                clean_name = re.sub(r'\s*\(\d+\)\s*$', '', base_name).strip().lower()
                
                # Group by artist (parent folder) and song name to avoid false positives
                folder_name = os.path.basename(root).lower()
                group_key = f"{folder_name.capitalize()} - {clean_name.title()}"
                
                duplicates_map[group_key].append({
                    "path": full_path,
                    "filename": file,
                    "size": size,
                    "folder": os.path.basename(root)
                })
                
    results = []
    for name, files in duplicates_map.items():
        if len(files) > 1:
            results.append({
                "clean_name": name,
                "files": files
            })
            
    return results

def delete_files(file_paths: list):
    deleted = 0
    errors = []
    for path in file_paths:
        try:
            if os.path.exists(path):
                os.remove(path)
                deleted += 1
        except Exception as e:
            errors.append({"path": path, "error": str(e)})
    return deleted, errors
