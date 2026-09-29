import type { ChoiceKey } from './types'

/**
 * 결과 글의 문장 템플릿.
 * {중괄호} 자리는 composeResult가 채운다. 조합 규칙 자체는 src/compose/composeResult.ts에 있다.
 * 조사(을/를, 이/가 …)는 채워 넣는 말에 맞춰 자동으로 붙으니, 템플릿에는 조사 없이 {자리}만 둔다.
 */
export const resultText = {
  recurring: {
    // 인용한 말이 '-다'로 끝나면 composeResult가 '{quotes}이라는'을 '…다'는'으로 바꾼다
    quoted: '요즘 머릿속에 {quotes}이라는 말이 자주 맴돌았어요.',
    turn: '그런데 그 실마리는 방금 고른 답들 안에 이미 있었어요.',
    none: '요즘 말로 다 하기 어려운 생각을 안고 있었어요. 그런데 그 실마리는 방금 고른 답들 안에 이미 있었어요.',
  },

  hope: {
    recognition:
      '인정받기를 기대했지만, 인정은 이미 받고 있었어요. {where}. 무너진 건 인정이 아니라, 그다음에 올 거라 믿었던 기회였을 거예요.',
    recognitionWhere: {
      titled: '맡고 있던 역할',
      followed: '일하는 방식을 따라 준 동료들',
    },
    recognitionWhereBoth: '{a}도, {b}도 그 증거예요',
    recognitionWhereOne: '{a}이 그 증거예요',
    rooted: '팀에 자리 잡기를 바랐던 방식은, 동료들이 실제로 따라 준 그때 이미 뿌리내리고 있었어요.',
    belonging:
      '오래 함께하길 바랐던 관계는 {traces}에게 이미 흔적을 남겼어요. 함께한 시간이 끝났다고 그 흔적까지 사라지지는 않아요.',
    certainty:
      '확실한 답을 원했지만, 지금까지 쌓아 온 것들은 한 회사의 확실함보다 더 오래가는 무언가를 가리키고 있어요.',
    leftover: '{items}도 마찬가지예요.',
    fallback:
      '기대했던 건 {hopes}이었지만, 실제로 곁에는 {evidence}이 있었어요. 기대한 모습은 아니어도 이미 가지고 있던 것들이에요.',
    noEvidence:
      '이뤄 낸 것이 아직 떠오르지 않는다면, 없어서가 아니라 기대한 모습으로 오지 않아서일 수도 있어요.',
  },

  path: {
    stations: '{stations}.',
    across: '이름도 하는 일도 달랐지만, 어디에서든 비슷한 일을 되풀이해 왔어요.',
    acrossOne: '한 곳이었지만, 그 안에서도 모습을 바꿔 가며 비슷한 일을 되풀이해 왔어요.',
    acrossNoStations: '처음부터 돌아보면, 어느 자리에서든 비슷한 일을 되풀이해 왔어요.',
    threads: '바로 {threads}이에요.',
    revealAndCriteria:
      '진짜 원인을 찾아내야 흔들리지 않는 기준을 세울 수 있으니, 이 둘은 사실 하나로 이어진 일이에요.',
    many: '따로 떨어진 재주처럼 보여도, 같은 관심이 자리마다 다른 모습으로 드러난 거예요.',
    one: '자리가 바뀌어도 이 일만큼은 늘 곁에 있었어요.',
    none: '되풀이해 온 일이 아직 잘 보이지 않는다면, 거쳐 온 곳들을 하나씩 떠올리며 그때 무슨 일을 했는지 적어 보세요. 자주 겹치는 말이 보일 거예요.',
  },

  burning: {
    mismatch: '기대한 건 인정이었는데, 정작 가슴이 뛰었던 건 칭찬받을 때가 아니라 {moments}이었어요.',
    mismatchClose: '이 차이 안에 일을 계속하게 만드는 진짜 이유가 있어요.',
    withPraise: '인정받은 순간도 분명 큰 힘이 됐어요. 그리고 {moments}도 똑같이 가슴을 뛰게 했어요.',
    praiseOnly:
      '인정받은 순간이 힘이 된 건 자연스러운 일이에요. 다만 무엇을 해서 인정받았는지 떠올려 보면, 그 안에 되풀이해 온 일이 있어요.',
    general: '기대한 건 {hopes}이었지만, 정작 가슴이 뛰었던 건 {moments}이었어요.',
    generalClose: '기대한 것과 가슴 뛰었던 것 사이를 들여다보면, 어떤 일을 할 때 가장 살아 있는지가 보여요.',
    eyesBoth: '둘 다 무언가를 새롭게 깨닫는 순간이에요. 나 자신도, 다른 사람도요.',
    eyesSelf: '무언가를 새롭게 깨닫게 된 순간이었어요.',
    eyesOther: '누군가 무언가를 새롭게 깨닫는 순간이었어요.',
    none: '가슴 뛰었던 순간이 바로 떠오르지 않아도 괜찮아요. 한참 지나서야 알게 되는 순간도 있으니까요.',
  },

  return: {
    companions: '혼자 버텼다고 생각했겠지만, 곁에는 {companions}이 있었어요.',
    noCompanions:
      '혼자 버텨 왔다고 느낀다면 그것도 솔직한 답이에요. 다만 여기까지 오는 동안 누군가의 도움이 닿은 순간도 있었을 거예요.',
    lead: '이제 다음 자리를 고를 때 해 볼 수 있는 것들이에요.',
    practices: {
      choose_role_not_title:
        '채용 공고를 볼 때 직함보다 먼저, 그 자리에서 {thread}을 할 수 있는지 확인해 보세요.',
      choose_trusting_org:
        "면접 마지막에 이렇게 물어보세요. '최근 팀에서 잘못된 결정이 있었을 때, 그 뒤에 어떻게 대처했나요?' 대답을 들어 보면 그곳이 실수를 탓하는 곳인지, 다시 기회를 주는 곳인지 알 수 있어요.",
      work_for_opening: "새 일터에서 한 주를 마칠 때마다 스스로에게 물어보세요. '이번 주에 누가 무엇을 새롭게 깨달았지?'",
      ending_as_start:
        "'왜 그만두셨어요?'라는 질문에는 변명 대신 이렇게 답해 보세요. '그곳에서 제가 꾸준히 잘해 온 일이 무엇인지 분명히 알게 됐어요. 그 일을 더 믿고 맡겨 주는 곳에서 이어 가고 싶습니다.'",
    } as Record<string, string>,
    threadFallback: '지금까지 되풀이해 온 일',
    custom: '직접 적은 다짐, {quoted}. 이 문장을 이번 주 다이어리 첫 줄에 적어 두세요.',
  },

  /**
   * '직접 적기'로 적은 말을 문장 안에 끼워 넣을 때의 모양. {quoted}는 따옴표로 감싼 그 말.
   * 따옴표 안 말의 받침에 맞춰 뒤따르는 조사가 자동으로 붙는다. ('…것'이었지만, '…친구'가)
   */
  customEcho: {
    recurring: '{quoted}',
    hope: '{quoted}',
    evidence: '{quoted}',
    thread: '{quoted}',
    burning: '{quoted}',
    companions: '{quoted}',
  } as Record<string, string>,
}

/**
 * '성경 구절과 함께 보기'를 켠 사람에게는 결과 글 문단마다 이 걸음들의 구절을 함께 보여 준다.
 * 문단 → 그 문단을 만든 단계(steps.ts의 key)
 */
export const paragraphScenes: Record<'recurring' | 'hope' | 'path' | 'burning' | 'return', ChoiceKey[]> = {
  recurring: ['recurring'],
  hope: ['hope', 'evidence'],
  path: ['thread'],
  burning: ['burning'],
  return: ['companions', 'return'],
}

/** 결과 글 맨 아래, 스크롤한 뒤에야 보이는 이야기의 바탕 */
export const revealText = {
  lead: "이 테스트는 성경 누가복음 24장, '엠마오로 가는 길' 이야기를 바탕으로 만들었어요.",
  /** '성경 구절과 함께 보기'를 켠 사람에게는 첫 문장이 이것으로 바뀐다 */
  leadScripture: '지금까지 함께 읽어 온 성경 이야기예요.',
  body: "기대가 무너져 고향으로 돌아가던 두 제자가, 길에서 만난 낯선 사람과 이야기를 나눕니다. 그가 예수라는 것은 끝까지 알아보지 못했지만, 나중에 서로 이렇게 말했어요. '길에서 그분이 이야기해 줄 때, 우리 마음이 뜨겁지 않았나요?' 그리고 그날 밤, 두 사람은 떠나왔던 길을 되돌아갑니다.",
  paraphraseNote: '구절은 읽기 쉽게 풀어 옮겼어요.',
  listToggle: '일곱 질문과 성경 구절 함께 보기',
}

/** 결과 화면의 길 연출 */
export const pathText = {
  /** 스크린리더용 대체 텍스트 */
  alt: '지나온 길을 거꾸로 되짚어 가면, 그 옆을 나란히 걸어 온 또 하나의 길이 드러나요.',
  companionsLabel: '곁에 있던 것',
  replay: '길 다시 보기',
  companionsFallback: '곁에 있던 누군가',
}

/** 결과 화면의 버튼과 안내 */
export const resultUi = {
  title: '커리어 회고 결과',
  saveImage: '결과를 이미지로 저장',
  includeReveal: '이미지에 성경 이야기도 함께 담기',
  saving: '이미지를 만들고 있어요.',
  saved: '이미지를 만들었어요. 저장되지 않았다면 아래 이미지를 길게 누르거나 마우스 오른쪽 버튼으로 저장해 주세요.',
  saveFailed: '이미지를 만들지 못했어요. 화면을 캡처해 두셔도 좋아요.',
  previewAlt: '저장할 결과 이미지',
  fileName: (date: string) => `돌아오는길_${date}.png`,
  restart: '처음부터 다시 하기',
  restartConfirm: '지금까지의 답이 모두 지워져요. 처음부터 다시 할까요?',
  restartYes: '다시 하기',
  restartNo: '취소',
  clear: '답 지우기',
  cleared: '이 기기에 남아 있던 답을 지웠어요. 이 화면을 닫으면 다시 볼 수 없어요.',
}
