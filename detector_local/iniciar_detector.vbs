
Set shell = CreateObject("WScript.Shell")

shell.Run "pythonw.exe """ & _
    CreateObject("Scripting.FileSystemObject").GetParentFolderName(WScript.ScriptFullName) & _
    "\detector_dataventor.py""", 0, False
