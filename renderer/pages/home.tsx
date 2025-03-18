import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import React, { useEffect, useState } from "react";

export default function HomePage() {
  const [appVersion, setAppVersion] = useState<string>("loading...");

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
    }
  }, []);

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
      </div>
      <div className="mt-1 w-full flex-wrap flex justify-center">
        <Link href="/next">Go to next page</Link>
      </div>
    </React.Fragment>
  );
}
