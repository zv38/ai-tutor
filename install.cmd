@echo off
rem ============================================================
rem  ai-tutor 一键安装脚本（Windows）
rem  把本技能包安装为 Claude Agent Skills（用户级全局技能）。
rem ============================================================
setlocal
set "SKILL_NAME=ai-tutor"
set "SRC_DIR=%~dp0"

if /i "%~1"=="--project" (
  set "DEST_DIR=%CD%\.claude\skills\%SKILL_NAME%"
  echo [target] 项目级 %DEST_DIR%
) else if /i "%~1"=="--uninstall" (
  if exist "%USERPROFILE%\.claude\skills\%SKILL_NAME%" (
    rmdir /s /q "%USERPROFILE%\.claude\skills\%SKILL_NAME%"
    echo [ok] 已卸载用户级技能
  )
  if exist "%CD%\.claude\skills\%SKILL_NAME%" (
    rmdir /s /q "%CD%\.claude\skills\%SKILL_NAME%"
    echo [ok] 已卸载项目级技能
  )
  echo 完成。 & goto :eof
) else (
  set "DEST_DIR=%USERPROFILE%\.claude\skills\%SKILL_NAME%"
  echo [target] 用户级 %DEST_DIR%
)

if not exist "%SRC_DIR%SKILL.md" (
  echo [error] 未找到 SKILL.md，请确认在 ai-tutor 仓库根目录运行
  exit /b 1
)

if not exist "%DEST_DIR%" mkdir "%DEST_DIR%"
copy /y "%SRC_DIR%SKILL.md" "%DEST_DIR%SKILL.md" >nul
if exist "%SRC_DIR%skills"  robocopy "%SRC_DIR%skills"  "%DEST_DIR%skills"  /E /NFL /NDL /NJH /NJS >nul
if exist "%SRC_DIR%scripts" robocopy "%SRC_DIR%scripts" "%DEST_DIR%scripts" /E /NFL /NDL /NJH /NJS >nul

echo.
echo [ok] 已安装到 %DEST_DIR%
echo.
echo 下一步：任意项目目录运行  claude，发一道错题即可开始。
echo 错题数据存于本机 data\mistake-book.json，不上传任何数据。
echo.
echo 卸载：%~nx0 --uninstall
endlocal