module.exports = async (context) => {
  console.log("패키징 후 작업 실행...");
  console.log("빌드 대상:", context.electronPlatformName);
  console.log("패키징 경로:", context.appOutDir);

  // 여기서 필요한 경우 패키징 후 작업을 수행할 수 있습니다.
  // 예: 설정 파일 수정, 파일 복사 등
};
