interface DecomposedTask {
  id: string;
  role: string;
  action: string;
  depends_on: string[];
  file_scope: string[];
}

const ROLE_PATTERNS: Array<{ keywords: string[]; role: string; fileScope: string[] }> = [
  { keywords: ["프론트엔드", "frontend", "react", "next.js", "컴포넌트", "ui", "페이지", "화면", "웹", "web", "앱", "app", "사이트", "대시보드", "dashboard"], role: "frontend_developer", fileScope: ["src/components/", "src/pages/", "app/"] },
  { keywords: ["백엔드", "backend", "api", "서버", "server", "엔드포인트", "rest", "graphql"], role: "backend_architect", fileScope: ["src/api/", "src/server/"] },
  { keywords: ["디자인", "design", "ui/ux", "figma", "와이어프레임"], role: "ui_designer", fileScope: ["design/"] },
  { keywords: ["테스트", "test", "qa", "검증", "e2e", "단위"], role: "qa_engineer", fileScope: ["tests/"] },
  { keywords: ["배포", "deploy", "ci/cd", "docker", "인프라", "devops"], role: "devops_automator", fileScope: ["infra/", ".github/"] },
  { keywords: ["보안", "security", "취약점", "감사", "audit"], role: "security_auditor_deep", fileScope: ["src/"] },
  { keywords: ["문서", "docs", "readme", "가이드", "문서화"], role: "korean_tech_writer", fileScope: ["docs/"] },
  { keywords: ["번역", "translate", "i18n", "다국어", "localization"], role: "translator", fileScope: ["src/locales/"] },
  { keywords: ["리팩토링", "refactor", "정리", "개선", "기술부채"], role: "refactoring_specialist", fileScope: ["src/"] },
  { keywords: ["데이터", "data", "파이프라인", "etl", "db", "데이터베이스", "sql", "크롤링", "crawl", "스크래핑", "scraping", "수집"], role: "data_pipeline_engineer", fileScope: ["src/data/"] },
  { keywords: ["게임", "game", "언리얼", "unreal", "유니티", "unity"], role: "game_designer", fileScope: ["src/"] },
  { keywords: ["gas", "gameplay ability", "어빌리티", "전투 시스템"], role: "unreal_gas_specialist", fileScope: ["src/"] },
  { keywords: ["마케팅", "marketing", "sns", "블로그", "홍보"], role: "content_strategist", fileScope: ["content/"] },
  { keywords: ["기획", "prd", "스펙", "요구사항", "제품"], role: "product_manager", fileScope: ["docs/"] },
  { keywords: ["ai", "ml", "모델", "학습", "추론", "llm", "분석", "뉴스"], role: "ai_engineer", fileScope: ["src/ai/", "src/ml/"] },
];

export function decomposePrompt(prompt: string): DecomposedTask[] {
  const lower = prompt.toLowerCase();
  const tasks: DecomposedTask[] = [];
  let taskId = 1;

  for (const pattern of ROLE_PATTERNS) {
    const matched = pattern.keywords.some((kw) => lower.includes(kw));
    if (matched) {
      // Extract the relevant part of the prompt for this role's action
      const action = extractActionForRole(prompt, pattern.keywords);
      tasks.push({
        id: `task_${taskId}`,
        role: pattern.role,
        action,
        depends_on: [],
        file_scope: pattern.fileScope,
      });
      taskId++;
    }
  }

  // If no patterns matched, create a general task
  if (tasks.length === 0) {
    tasks.push({
      id: "task_1",
      role: "frontend_developer",
      action: prompt,
      depends_on: [],
      file_scope: ["src/"],
    });
  }

  // Add dependencies: docs depend on implementation, tests depend on implementation
  const implTasks = tasks.filter((t) =>
    ["frontend_developer", "backend_architect", "ai_engineer", "data_pipeline_engineer", "game_designer", "unreal_gas_specialist"].includes(t.role)
  );
  const docTasks = tasks.filter((t) =>
    ["korean_tech_writer", "translator"].includes(t.role)
  );
  const testTasks = tasks.filter((t) => t.role === "qa_engineer");

  for (const doc of docTasks) {
    doc.depends_on = implTasks.map((t) => t.id);
  }
  for (const test of testTasks) {
    test.depends_on = implTasks.map((t) => t.id);
  }

  return tasks;
}

function extractActionForRole(prompt: string, keywords: string[]): string {
  // Try to find the sentence containing the keyword
  const sentences = prompt.split(/[.!?。]\s*/);
  for (const sentence of sentences) {
    const lower = sentence.toLowerCase();
    if (keywords.some((kw) => lower.includes(kw))) {
      return sentence.trim();
    }
  }
  return prompt;
}
