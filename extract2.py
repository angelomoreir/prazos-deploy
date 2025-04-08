import os
import zipfile

def extract_exe(exe_path, output_dir):
    # Cria o diretório de saída
    os.makedirs(output_dir, exist_ok=True)
    
    # Abre o executável como um arquivo zip
    with zipfile.ZipFile(exe_path, 'r') as zip_ref:
        # Extrai todos os arquivos
        zip_ref.extractall(output_dir)

if __name__ == '__main__':
    exe_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'dist', 'Prazos.exe')
    output_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'extracted2')
    extract_exe(exe_path, output_dir)
