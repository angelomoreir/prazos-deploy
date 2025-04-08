import os
import sys
import shutil
from PyInstaller.utils.hooks import collect_data_files

def extract_data_from_exe(exe_path, output_dir):
    # Cria o diretório de saída se não existir
    os.makedirs(output_dir, exist_ok=True)
    
    # Extrai os arquivos usando PyInstaller
    for source, dest in collect_data_files('prazos'):
        dest_path = os.path.join(output_dir, dest)
        os.makedirs(os.path.dirname(dest_path), exist_ok=True)
        shutil.copy2(source, dest_path)

if __name__ == '__main__':
    exe_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'dist', 'Prazos.exe')
    output_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'extracted')
    extract_data_from_exe(exe_path, output_dir)
