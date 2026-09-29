import type { ChoiceKey } from './types'

/**
 * 결과 글의 문장 템플릿.
 * {중괄호} 자리는 composeResult가 채운다. 조합 규칙 자체는 src/compose/composeResult.ts에 있다.
 * 조사(을/를, 이/가 …)는 채워 넣는 말에 맞춰 자동으로 붙으니, 템플릿에는 조사 없이 {자리}만 둔다.
 */
export const resultText = {
  recurring: {
    quoted: '당신은 {quotes}이라는 이야기를 되뇌며 걷고 있었어요.',
    turn: '그런데 그 답은 당신이 고른 답들 안에 이미 있었습니다.',
    none: '당신은 말로 다 옮기지 못한 이야기를 품고 걷고 있었어요. 그런데 그 답은 당신이 고른 답들 안에 이미 있었습니다.',
  },

  hope: {
    recognition:
      '당신은 인정받기를 바랐지만, 인정은 이미 있었어요. {where}. 무너진 건 인정이 아니라 그다음 장면에 대한 기대였을 거예요.',
    recognitionWhere: {
      titled: '맡고 있던 역할로',
      followed: '당신의 방식을 따라준 사람들로',
    },
    rooted: '뿌리내리길 바랐던 방식은, 사람들이 실제로 따라줬다는 사실 속에 이미 심겨 있었어요.',
    belonging:
      '오래 함께하길 바랐던 관계는 {traces} 안에 이미 흔적을 남겼어요. 함께한 시간이 끝났다고 해서 그 흔적까지 사라지지는 않아요.',
    certainty:
      '확실한 답을 바랐지만, 당신이 모은 증거들은 한 곳의 확실함보다 더 오래 가는 무언가를 가리켜요.',
    leftover: '{items}도 그 증거였어요.',
    fallback:
      '당신이 바랐던 건 {hopes}이었지만, 곁에는 {evidence}이 있었어요. 기대한 모양은 아니었지만 이미 곁에 있던 것들이에요.',
    noEvidence:
      '바란 것의 증거가 아직 보이지 않는다면, 그건 증거가 없어서가 아니라 기대한 모양으로 오지 않아서일지도 몰라요.',
  },

  path: {
    stations: '{stations}.',
    across: '이름도 모양도 다른 곳들이었지만, 당신은 그 길 위에서 모양만 바꾼 채 같은 일을 반복하고 있었어요.',
    acrossOne: '한 곳이었지만, 그 안에서도 당신은 모양만 바꾼 채 같은 일을 반복하고 있었어요.',
    acrossNoStations: '처음부터 다시 읽어 보면, 당신은 자리마다 모양만 바꾼 채 같은 일을 반복하고 있었어요.',
    threads: '{threads}.',
    revealAndCriteria:
      '가려진 진짜 원인을 드러내야 흔들리지 않는 기준을 세울 수 있으니, 이 둘은 사실 하나의 일이에요.',
    many: '따로 떨어진 재능처럼 보이지만, 같은 마음이 다른 자리에서 다른 모양으로 나타난 것이에요.',
    one: '이것이 모양만 바뀌어 반복되던 당신의 일이에요.',
    none: '반복되던 일에 아직 이름을 붙이지 못했다면, 걸어온 곳들의 이름을 한 번 더 소리 내어 읽어 보세요. 겹치는 동사가 들릴 거예요.',
  },

  burning: {
    mismatch:
      '당신이 바란 건 인정이었는데, 마음이 뜨거웠던 건 인정받을 때가 아니라 {moments}이었어요.',
    mismatchClose: '이 어긋남 안에 당신이 실제로 일하는 이유가 있어요.',
    withPraise: '인정받은 순간은 분명 당신을 움직였어요. 그리고 그 곁에서 {moments}도 당신을 움직이고 있었어요.',
    praiseOnly:
      '인정받은 순간이 당신을 움직였다는 걸 부정할 필요는 없어요. 다만 무엇을 해서 인정받았는지를 돌아보면, 그 안에 당신이 반복해온 일이 있어요.',
    general: '당신이 바란 건 {hopes}이었지만, 마음이 뜨거웠던 건 {moments}이었어요.',
    generalClose: '바란 것과 뜨거웠던 것 사이의 거리를 재어 보면, 당신이 어디에서 살아 있는지가 보여요.',
    eyesBoth: '둘 다 눈이 열리는 순간이에요. 당신의 눈이, 그리고 다른 누군가의 눈이.',
    eyesSelf: '그건 당신의 눈이 열리는 순간이었어요.',
    eyesOther: '그건 누군가의 눈이 열리는 순간이었어요.',
    none: '마음이 뜨거웠던 순간이 선뜻 떠오르지 않는다면, 그것도 정직한 대답이에요. 지나고 나서야 알게 되는 뜨거움도 있으니까요.',
  },

  return: {
    companions: '혼자 버틴다고 생각했지만, 그 길에는 {companions}이 함께 걷고 있었어요.',
    noCompanions: '혼자 걸어왔다고 느낀다면, 그 느낌도 정직한 답이에요. 다만 여기까지 온 걸음 중 어떤 것은 누군가 곁에 있어서 가능했을지도 몰라요.',
    lead: '이제 같은 길을 새로운 눈으로 다시 걷는다면.',
    practices: {
      choose_role_not_title:
        '다음 공고를 볼 때 직함보다 먼저, 그 자리에서 {thread}을 할 수 있는지를 확인하세요.',
      choose_trusting_org:
        "면접 마지막에 물어보세요. '최근 팀에서 틀린 결정이 있었을 때, 그 뒤에 어떻게 다뤄졌나요?' 답하는 방식에서 그곳이 틀림을 벌하는지, 다시 믿어주는지가 보입니다.",
      work_for_opening: '다음 일터에서 스스로에게 물을 질문 하나. 이번 주, 누구의 눈이 열렸나?',
      ending_as_start:
        "'왜 그만뒀나요'라는 질문에는 해명 대신 이렇게 답해보세요. '그곳에서 제가 반복해서 잘해온 일이 무엇인지 분명히 알게 됐고, 그 일을 더 믿고 맡겨주는 곳에서 다시 하고 싶습니다.'",
    } as Record<string, string>,
    threadFallback: '당신이 반복해온 일',
    custom: '당신이 적은 한 줄, {quoted}. 이 문장을 다음 한 주의 첫 줄에 적어두세요.',
  },

  /** '직접 적기'로 적은 말을 문장 안에 끼워 넣을 때의 모양. {quoted}는 따옴표로 감싼 그 말. */
  customEcho: {
    recurring: '{quoted}',
    hope: '{quoted}이라고 적은 바람',
    evidence: '{quoted}이라고 적은 것',
    thread: '{quoted}이라고 적은 일',
    burning: '{quoted}이라고 적은 순간',
    companions: '{quoted}이라고 적은 것',
  } as Record<string, string>,
}

/**
 * '처음부터 말씀과 함께 걷기'를 켠 사람에게는 결과 글 문단마다 이 걸음들의 구절을 함께 보여 준다.
 * 문단 → 그 문단을 만든 걸음(steps.ts의 key)
 */
export const paragraphScenes: Record<'recurring' | 'hope' | 'path' | 'burning' | 'return', ChoiceKey[]> = {
  recurring: ['recurring'],
  hope: ['hope', 'evidence'],
  path: ['thread'],
  burning: ['burning'],
  return: ['companions', 'return'],
}

/** 결과 글 맨 아래, 스크롤 후에만 나타나는 드러남 영역 */
export const revealText = {
  lead: '이 길은 누가복음 24장, 엠마오로 가는 두 제자의 이야기를 따라 만들어졌습니다.',
  /** '처음부터 말씀과 함께 걷기'를 켠 사람에게는 첫 문장이 이것으로 바뀐다 */
  leadScripture: '당신이 함께 읽으며 걸어온 이야기입니다.',
  body: "그들은 길 위에서 동행자를 알아보지 못했지만, 나중에 이렇게 말했어요. '길에서 우리에게 말씀하실 때에 우리 속에서 마음이 뜨겁지 아니하더냐.'",
  listToggle: '일곱 걸음과 구절 나란히 보기',
}

/** 결과 화면의 길 연출 */
export const pathText = {
  /** 스크린리더용 대체 텍스트 */
  alt: '걸어온 길을 되돌아가자, 나란히 걷던 또 하나의 길이 드러납니다.',
  replay: '길을 한 번 더 되돌아가 보기',
  companionsFallback: '곁에 있던 누군가',
}

/** 결과 화면의 버튼과 안내 */
export const resultUi = {
  saveImage: '결과를 이미지로 저장',
  includeReveal: '이미지에 이야기의 원형도 함께 담기',
  saving: '이미지를 만드는 중이에요.',
  saved: '이미지를 만들었어요. 저장이 되지 않았다면 아래 이미지를 길게 누르거나 오른쪽 클릭해서 저장하세요.',
  saveFailed: '이미지를 만들지 못했어요. 화면을 캡처해 두셔도 좋아요.',
  fileName: (date: string) => `돌아오는길_${date}.png`,
  restart: '처음부터 다시 걷기',
  restartConfirm: '지금 답은 모두 지워져요. 처음부터 다시 걸을까요?',
  restartYes: '처음부터 다시 걷기',
  restartNo: '그대로 두기',
  clear: '답 지우기',
  cleared: '이 기기에 남아 있던 답을 지웠어요. 이 화면을 닫으면 다시 볼 수 없어요.',
}
