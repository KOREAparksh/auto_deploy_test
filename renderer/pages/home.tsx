import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import React, { useEffect, useState } from "react";

export default function HomePage() {
  const [appVersion, setAppVersion] = useState<string>("loading...");
  const [updateStatus, setUpdateStatus] = useState<string>("");
  const [updateInfo, setUpdateInfo] = useState<any>(null);

  useEffect(() => {
    // 클라이언트 사이드에서만 실행
    if (typeof window !== "undefined" && window.electron) {
      window.electron
        .getAppVersion()
        .then((version) => {
          setAppVersion(version);
        })
        .catch((err) => {
          console.error("버전 정보를 가져오는데 실패했습니다:", err);
          setAppVersion("unknown");
        });

      // 업데이트 상태 이벤트 리스너 설정
      const removeListener = window.electron.onUpdateStatus((status) => {
        console.log("업데이트 상태:", status);

        if (status.status === "checking") {
          setUpdateStatus("업데이트 확인 중...");
        } else if (status.status === "available") {
          setUpdateStatus(`새 버전 ${status.version} 사용 가능, 다운로드 중...`);
          setUpdateInfo(status);
        } else if (status.status === "not-available") {
          setUpdateStatus("최신 버전을 사용 중입니다.");
        } else if (status.status === "downloading") {
          setUpdateStatus(`업데이트 다운로드 중: ${Math.round(status.percent)}%`);
        } else if (status.status === "downloaded") {
          setUpdateStatus(`업데이트가 다운로드 되었습니다. 곧 설치됩니다...`);
          setUpdateInfo(status);
        } else if (status.status === "error") {
          setUpdateStatus(`업데이트 오류: ${status.error}`);
        }
      });

      // 컴포넌트 언마운트 시 리스너 제거
      return () => {
        if (removeListener) removeListener();
      };
    }
  }, []);

  // 수동으로 업데이트 확인
  const checkForUpdates = () => {
    if (window.electron) {
      setUpdateStatus("업데이트 확인 중...");
      window.electron.checkForUpdates();
    }
  };

  return (
    <React.Fragment>
      <Head>
        <title>Home - Nextron (with-tailwindcss)</title>
      </Head>
      <div className="grid grid-col-1 text-2xl w-full text-center">
        <div>
          <Image
            className="ml-auto mr-auto"
            src="/images/logo.png"
            alt="Logo image"
            width={256}
            height={256}
          />
        </div>
        <span>⚡ Electron ⚡</span>
        <span>+</span>
        <span>Next.js</span>
        <span>+</span>
        <span>tailwindcss</span>
        <span>=</span>
        <span>💕 </span>

        {/* 앱 버전 표시 */}
        <div>
          <span>버전: {appVersion}</span>
        </div>

        {/* 업데이트 상태 표시 */}
        <div className="mt-4 text-base">
          <p>{updateStatus || "업데이트 상태: 확인 전"}</p>
          {updateInfo && updateInfo.releaseNotes && (
            <div className="mt-2 text-sm bg-gray-100 p-2 rounded">
              <h4 className="font-bold">릴리즈 노트:</h4>
              <p>{updateInfo.releaseNotes}</p>
            </div>
          )}
          <button
            onClick={checkForUpdates}
            className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 text-base"
          >
            업데이트 확인
          </button>
        </div>
      </div>
      <div className="mt-1 w-full flex-wrap flex justify-center">
        <Link href="/next">Go to next page</Link>
      </div>
    </React.Fragment>
  );
}
