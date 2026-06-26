import os
import re

dirs = ['d:/RetainIQ/frontend/src', 'd:/RetainIQ/backend']
for d in dirs:
    for root, _, files in os.walk(d):
        for f in files:
            if f.endswith(('.ts', '.tsx', '.py', '.json')):
                path = os.path.join(root, f)
                with open(path, 'r', encoding='utf-8', errors='ignore') as file:
                    content = file.read()
                
                # Replace standalone USD with INR
                new_content = re.sub(r'\bUSD\b', 'INR', content)
                # Replace $ with ₹ ONLY IF not followed by {
                new_content = re.sub(r'\$(?!\{)', '₹', new_content)
                
                if new_content != content:
                    with open(path, 'w', encoding='utf-8', errors='ignore') as file:
                        file.write(new_content)
                    print(f'Updated {path}')
