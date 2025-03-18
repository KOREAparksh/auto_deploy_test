<p align="center"><img src="https://i.imgur.com/a9QWW0v.png"></p>

## Usage

### Create an App

```
# with npx
$ npx create-nextron-app my-app --example with-tailwindcss

# with yarn
$ yarn create nextron-app my-app --example with-tailwindcss

# with pnpm
$ pnpm dlx create-nextron-app my-app --example with-tailwindcss
```

### Install Dependencies

```
$ cd my-app

# using yarn or npm
$ yarn (or `npm install`)

# using pnpm
$ pnpm install --shamefully-hoist
```

### Use it

```
# development mode
$ yarn dev (or `npm run dev` or `pnpm run dev`)

# production build
$ yarn build (or `npm run build` or `pnpm run build`)
```

## 자동 업데이트 기능

이 앱은 GitHub Release를 이용한 자동 업데이트 기능을 지원합니다. 앱이 실행될 때 자동으로 최신 버전을 확인하고, 업데이트가 있을 경우 다운로드하여 설치합니다.

### 업데이트 프로세스

1. 앱이 시작되면 자동으로 최신 버전을 확인합니다.
2. 새 버전이 있으면 자동으로 다운로드하고 설치합니다.
3. 설치가 완료되면 앱이 재시작됩니다.

### 릴리즈 방법

새 버전을 릴리즈하려면:

1. `package.json`의 버전을 업데이트합니다 (예: 1.0.0 → 1.0.1). 다음 명령어를 사용하면 쉽게 버전을 업데이트할 수 있습니다:

   ```
   # 패치 버전 업데이트 (1.0.0 → 1.0.1)
   $ yarn version:patch

   # 마이너 버전 업데이트 (1.0.0 → 1.1.0)
   $ yarn version:minor

   # 메이저 버전 업데이트 (1.0.0 → 2.0.0)
   $ yarn version:major
   ```

2. 변경 사항을 커밋합니다.
3. 새 태그를 생성합니다: `git tag v1.0.1`
4. 태그를 푸시합니다: `git push origin v1.0.1`

GitHub Actions 워크플로우가 자동으로 앱을 빌드하고 GitHub Release를 생성합니다.

### 직접 릴리즈하기

GitHub Actions을 사용하지 않고 로컬에서 직접 릴리즈할 수도 있습니다:

```
# Windows 빌드 및 릴리즈
$ GH_TOKEN=your_github_token yarn deploy:win

# Mac 빌드 및 릴리즈 (macOS에서만 가능)
$ GH_TOKEN=your_github_token yarn deploy:mac
```

윈도우 환경에서는 다음과 같이 환경변수를 설정합니다:

```
# PowerShell
$ $env:GH_TOKEN="your_github_token"; yarn deploy:win

# CMD
$ set GH_TOKEN=your_github_token && yarn deploy:win
```

### 원스텝 버전 업데이트 및 배포

버전 업데이트와 배포를 한 번에 처리할 수 있는 편리한 스크립트도 제공합니다:

```
# Windows용 패치 버전 업데이트 및 배포
$ GH_TOKEN=your_github_token yarn release:win:patch

# Windows용 마이너 버전 업데이트 및 배포
$ GH_TOKEN=your_github_token yarn release:win:minor

# Windows용 메이저 버전 업데이트 및 배포
$ GH_TOKEN=your_github_token yarn release:win:major

# Mac용 패치 버전 업데이트 및 배포
$ GH_TOKEN=your_github_token yarn release:mac:patch
```

이 명령어는 버전을 업데이트하고 빌드 생성 후 GitHub Release에 자동으로 배포합니다.

### 환경 변수

- `GH_TOKEN`: GitHub 토큰이 필요합니다. 이 토큰은 GitHub Release에 액세스하기 위해 사용됩니다.
