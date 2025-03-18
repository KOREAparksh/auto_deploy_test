!macro customHeader
  ; 자동 업데이트 관련 사용자 정의 헤더
  !system "echo '자동 업데이트 NSIS 헤더 로드 중'"
!macroend

!macro customInit
  ; 설치 시작 시 작업
  SetSilent silent
!macroend

!macro customInstall
  ; 설치 완료 후 작업
  !system "echo '자동 업데이트 설치 중'"
!macroend

!macro customInstallMode
  ; 업데이트 설치 시 사용자 UI 최소화를 위한 설정
  IfSilent 0 +2
  SetSilent silent
  ${IfNot} ${Silent}
    ${If} ${IsUpdate}
      SetSilent silent
    ${EndIf}
  ${EndIf}
!macroend

; 업데이트 후 자동 실행을 위한 매크로
!macro customUnInstall
  !system "echo '업데이트 완료 후 자동 실행 준비'"
!macroend

; 설치 완료 후 실행 매크로
!macro customFinishRun
  Exec "$INSTDIR\${APP_EXECUTABLE_FILENAME}"
!macroend 