[Setup]
AppName=PendriMP3
AppVersion=3.0
DefaultDirName={autopf}\PendriMP3
DefaultGroupName=PendriMP3
UninstallDisplayIcon={app}\PendriMP3.exe
Compression=lzma2
SolidCompression=yes
OutputDir=setup_output
OutputBaseFilename=PendriMP3_v3.0_Setup
SetupIconFile=backend\icon.ico

[Files]
Source: "backend\dist\PendriMP3\*"; DestDir: "{app}"; Flags: ignoreversion recursesubdirs createallsubdirs

[Icons]
Name: "{group}\PendriMP3"; Filename: "{app}\PendriMP3.exe"
Name: "{autodesktop}\PendriMP3"; Filename: "{app}\PendriMP3.exe"; Tasks: desktopicon

[Tasks]
Name: "desktopicon"; Description: "Crear un icono en el Escritorio"; GroupDescription: "Iconos adicionales:"

[Run]
Filename: "{app}\PendriMP3.exe"; Description: "Ejecutar PendriMP3 ahora"; Flags: nowait postinstall skipifsilent
