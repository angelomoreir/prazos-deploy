import os
import sys

# Função para verificar o conteúdo do executável
def verify_exe(exe_path):
    # Verifica se o arquivo existe
    if not os.path.exists(exe_path):
        print(f"Erro: O arquivo {exe_path} não existe.")
        return
        
    # Verifica o tamanho do arquivo
    size = os.path.getsize(exe_path)
    print(f"Tamanho do executável: {size} bytes")
    
    # Tenta abrir o arquivo para verificar se é um executável válido
    try:
        with open(exe_path, 'rb') as f:
            # Lê os primeiros bytes para verificar o cabeçalho PE
            header = f.read(2)
            if header != b'MZ':  # Assinatura PE
                print("Erro: O arquivo não é um executável válido.")
                return
    except Exception as e:
        print(f"Erro ao ler o arquivo: {e}")
        return

    print("O arquivo parece ser um executável válido.")

if __name__ == '__main__':
    exe_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'dist', 'Prazos.exe')
    verify_exe(exe_path)
