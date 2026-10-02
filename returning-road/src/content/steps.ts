import type { Step } from './types'

/**
 * 일곱 단계의 질문과 선택지.
 * 선택지 label은 질문에 대한 답으로 자연스럽게 읽히도록, echo는 결과 글에 그대로 끼워 넣을 수 있는 명사구로 쓴다.
 * scene 구절은 테스트 도중에는 보이지 않고, 결과 화면 맨 아래에서만 공개된다.
 * (시작 화면에서 '성경 구절과 함께 보기'를 켜면 질문마다 먼저 보인다.)
 * 배경(dusk)은 한낮(0)에서 해질녘(0.5)으로 걸음마다 조금씩 기울고, 6단계에서 저녁(1)이 된다.
 * 주의: 0.33~0.48 사이의 배경에서는 잉크색도 저녁빛 텍스트도 WCAG AA(4.5:1)를 넘지 못한다.
 * 그래서 글자색이 바뀌는 4-1 → 4-2 사이에서 한 번 크게 기운다. (src/lib/sky.test.ts가 검사)
 * 구절(quote)은 누구나 읽을 수 있도록 개역한글판을 쉬운 우리말로 풀어 옮긴 것이다. 번역본을 그대로 인용하지 않는다.
 */
export const steps: Step[] = [
  {
    number: 1,
    key: 'recurring',
    question: '요즘 일을 생각하면, 머릿속에 자주 맴도는 말은 무엇인가요?',
    dusk: 0.06,
    options: [
      { id: 'lost_place', label: '이만큼 했는데, 아직도 내 자리가 어딘지 모르겠다' },
      { id: 'must_prove', label: '뭔가를 더 보여 줘야 인정받을 것 같다' },
      { id: 'scattered', label: '갈 수 있는 길이 너무 많아서 오히려 방향을 못 잡겠다' },
      { id: 'ending_weighs', label: '지난 회사를 떠난 방식이 계속 마음에 걸린다' },
    ],
    scene: {
      ref: '누가복음 24:17',
      quote: '길을 걸으며 두 사람이 그렇게 주고받는 이야기가 무엇인가요?',
      scene: '낙심해 고향으로 돌아가던 두 제자에게, 낯선 사람이 다가와 무슨 이야기를 하며 걷는지 묻습니다.',
    },
  },
  {
    number: 2,
    key: 'hope',
    question: '마지막으로 일한 곳에서, 가장 크게 기대했던 것은 무엇이었나요?',
    dusk: 0.13,
    options: [
      { id: 'recognition', label: '인정받고 더 큰 역할을 맡게 되는 것', echo: '인정받고 더 큰 역할을 맡는 것' },
      { id: 'rooted', label: '내가 만든 일하는 방식이 팀에 자리 잡는 것', echo: '직접 만든 일하는 방식이 팀에 자리 잡는 것' },
      { id: 'belonging', label: '함께 일한 사람들과 오래 가는 것' },
      { id: 'certainty', label: '그곳이 내 커리어의 확실한 답이 되는 것', echo: '그곳이 커리어의 확실한 답이 되는 것' },
    ],
    scene: {
      ref: '누가복음 24:21',
      quote: '우리는 그분이 우리를 구해 줄 사람이라고 기대했어요.',
      scene: '두 사람은 무엇을 기대했는지, 그리고 그 기대가 어떻게 무너졌는지 털어놓습니다.',
    },
  },
  {
    number: 3,
    key: 'evidence',
    question: '기대한 모습은 아니었어도, 돌아보면 이미 이뤄 낸 것은 무엇인가요?',
    dusk: 0.2,
    options: [
      { id: 'followed', label: '내 방식을 실제로 따라 준 동료들', echo: '일하는 방식을 따라 준 동료들' },
      { id: 'results', label: '내 판단으로 만들어 낸 성과와 숫자', echo: '직접 판단해서 만들어 낸 성과와 숫자' },
      { id: 'changed_someone', label: '나와 일하면서 생각이 바뀐 사람', echo: '함께 일하며 생각이 바뀐 사람' },
      {
        id: 'finished_alongside',
        label: '일하면서 끝까지 해낸 다른 일 (공부, 개인 프로젝트 등)',
        echo: '일하면서 끝까지 해낸 다른 일',
      },
      { id: 'titled', label: '이미 맡고 있던 역할과 직책', echo: '이미 맡고 있던 역할과 직책' },
    ],
    scene: {
      ref: '누가복음 24:22-24',
      quote: '무덤이 비어 있었다는 이야기를 들었지만, 우리는 그분을 직접 보지는 못했어요.',
      scene: '희망의 소식은 이미 들려왔지만, 두 사람은 그것을 알아차리지 못했습니다.',
    },
  },
  {
    number: 4,
    key: 'thread',
    question: '자리는 달라도, 어디에서든 되풀이해 온 일은 무엇이었나요?',
    dusk: 0.5,
    stations: {
      question: '지금까지 거쳐 온 곳을 순서대로 적어 보세요.',
      hint: '학교, 회사, 프로젝트 무엇이든 괜찮아요. 일곱 곳까지 적을 수 있어요.',
      dusk: 0.27,
    },
    options: [
      { id: 'set_criteria', label: '근거 없이 흔들리는 결정에 기준을 세우는 일', echo: '흔들리는 결정에 기준을 세우는 일' },
      { id: 'structure_confusion', label: '사람들이 헤매는 지점을 찾아 구조로 정리하는 일', echo: '사람들이 헤매는 지점을 구조로 정리하는 일' },
      { id: 'reveal_hidden', label: '가려진 진짜 원인이나 편향을 찾아내는 일', echo: '가려진 진짜 원인을 찾아내는 일' },
      { id: 'translate_between', label: '입장이 다른 사람들 사이에서 말을 옮기고 잇는 일', echo: '입장이 다른 사람들을 잇는 일' },
      { id: 'grow_people', label: '사람을 챙기고 성장하도록 돕는 일' },
      { id: 'make_first', label: '없던 것을 처음 만들어 내는 일' },
    ],
    scene: {
      ref: '누가복음 24:27',
      quote: '그는 성경의 처음부터 차근차근 풀어 주며, 모든 이야기가 하나로 이어진다는 것을 보여 주었습니다.',
      scene: '흩어져 보이던 일들이 사실은 하나의 이야기였다는 것을, 처음부터 다시 짚어 줍니다.',
    },
  },
  {
    number: 5,
    key: 'burning',
    question: '그때는 그냥 일이었는데, 돌아보니 가장 가슴 뛰었던 순간은 언제였나요?',
    dusk: 0.62,
    options: [
      { id: 'wrong_then_saw', label: '내 생각이 틀렸다는 걸 알고, 비로소 제대로 보게 된 순간', echo: '생각이 틀렸다는 걸 알고 비로소 제대로 보게 된 순간' },
      { id: 'someone_saw_self', label: '누군가 자기 강점을 스스로 알아차린 순간' },
      { id: 'pieces_connected', label: '흩어져 있던 것들이 하나로 연결된 순간' },
      { id: 'made_something', label: '처음 만든 것을 세상에 내놓은 순간' },
      { id: 'was_praised', label: '인정받고 칭찬받은 순간' },
    ],
    scene: {
      ref: '누가복음 24:32',
      quote: '길에서 그분이 성경을 풀어 줄 때, 우리 마음이 뜨겁지 않았나요?',
      scene: '그때는 몰랐지만, 돌아보니 그 길 위에서 이미 마음이 뜨거웠습니다.',
    },
  },
  {
    number: 6,
    key: 'companions',
    question: '혼자 버텼다고 생각했지만, 사실 곁에서 힘이 되어 준 것은 무엇이었나요?',
    dusk: 1,
    options: [
      { id: 'colleagues', label: '실수했을 때도 다시 믿어 준 동료', short: '다시 믿어 준 동료' },
      { id: 'teachers', label: '배우는 자리에서 만난 선생님과 선배', short: '선생님과 선배' },
      { id: 'words', label: '힘들 때 붙잡고 있던 말이나 신념', echo: '힘들 때 붙잡고 있던 말과 신념', short: '붙잡고 있던 말' },
      { id: 'family_friends', label: '지친 날 곁에 있어 준 가족과 친구', short: '가족과 친구' },
    ],
    scene: {
      ref: '누가복음 24:29',
      quote: '날이 저물었으니, 오늘은 우리와 함께 머물러요.',
      scene: '해가 지자 두 사람은 길에서 만난 낯선 사람에게 함께 머물자고 청합니다.',
    },
  },
  {
    number: 7,
    key: 'return',
    question: '다음 커리어를 고를 때, 무엇을 다르게 해 보고 싶나요?',
    dusk: 1,
    options: [
      { id: 'choose_role_not_title', label: '더 높은 직함보다, 내가 잘해 온 일을 할 수 있는 자리를 고른다' },
      { id: 'choose_trusting_org', label: '실수해도 다시 믿어 주는 사람들이 있는 곳을 고른다' },
      { id: 'work_for_opening', label: '인정받기보다, 누군가 새롭게 깨닫는 순간을 위해 일한다' },
      { id: 'ending_as_start', label: '지난 회사를 떠난 일을 실패가 아니라 새 출발로 받아들인다' },
    ],
    scene: {
      ref: '누가복음 24:33',
      quote: '두 사람은 곧바로 일어나 예루살렘으로 돌아갔습니다.',
      scene: '그날 밤, 두 사람은 떠나왔던 길을 다시 걸어 돌아갑니다.',
    },
  },
]

export const MAX_STATIONS = 7

export const stepByKey = Object.fromEntries(steps.map((s) => [s.key, s])) as Record<
  Step['key'],
  Step
>
