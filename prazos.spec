# -*- mode: python ; coding: utf-8 -*-

import os
import sys

# Caminho para o diretório do projeto
proj_dir = os.path.dirname(os.path.abspath('app.py'))

# Adiciona os diretórios templates e static
a = Analysis(
    ['app.py'],
    pathex=[proj_dir],
    datas=[
        (os.path.join(proj_dir, 'templates'), 'templates'),
        (os.path.join(proj_dir, 'static'), 'static'),
        (os.path.join(proj_dir, 'database.db'), '.'),  # Incluir o banco na raiz
    ],
    hiddenimports=[],
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=[],
    win_no_prefer_redirects=False,
    win_private_assemblies=False,
    noarchive=False,
)

pyz = PYZ(a.pure, a.zipped_data, cipher=None)

exe = EXE(
    pyz,
    a.scripts,
    a.binaries,
    a.zipfiles,
    a.datas,
    [],
    name='Prazos',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    upx_exclude=[],
    runtime_tmpdir=None,
    console=True,
    disable_windowed_traceback=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
)
