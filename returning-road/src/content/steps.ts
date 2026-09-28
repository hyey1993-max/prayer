import type { Step } from './types'

/**
 * 일곱 걸음의 질문과 선택지.
 * scene 구절은 테스트 도중에는 보이지 않고, 결과 화면의 드러남 영역에서만 공개된다.
 * (설정에서 '처음부터 말씀과 함께 걷기'를 켜면 단계마다 먼저 보인다.)
 * 구절 본문은 개역한글판 기준. 배포 전에 원문과 한 번 더 대조할 것.
 */
export const steps: Step[] = [
  {
    number: 1,
    key: 'recurring',
    question: '요즘 일에 대해 혼자 걸을 때, 가장 자주 되뇌는 이야기는 무엇인가요?',
    dusk: 0.1,
    options: [
      { id: 'lost_place', label: '이만큼 했는데 아직 내 자리를 모르겠다' },
      { id: 'must_prove', label: '뭔가를 더 증명해야 인정받을 것 같다' },
      { id: 'scattered', label: '길이 너무 많아서 어디로 가야 할지 흩어진다' },
      { id: 'ending_weighs', label: '지난 곳에서 끝난 방식이 계속 마음에 걸린다' },
    ],
    scene: {
      ref: '누가복음 24:17',
      quote: '너희가 길 가면서 서로 주고 받고 하는 이야기가 무엇이냐',
      scene: '낯선 동행자가 두 사람에게 무슨 이야기를 하며 걷느냐고 묻는다.',
    },
  },
  {
    number: 2,
    key: 'hope',
    question: '마지막으로 몸담았던 곳에서, 가장 크게 바랐던 것은 무엇이었나요?',
    dusk: 0.22,
    options: [
      { id: 'recognition', label: '인정받고 더 큰 역할로 성장할 거라고', echo: '인정받고 더 큰 역할로 자라는 것' },
      { id: 'rooted', label: '내가 만든 일하는 방식이 뿌리내릴 거라고', echo: '당신이 만든 일하는 방식이 뿌리내리는 것' },
      { id: 'belonging', label: '함께한 사람들과 오래 갈 거라고', echo: '함께한 사람들과 오래 가는 것' },
      { id: 'certainty', label: '이곳이 내 길의 확실한 답이 될 거라고', echo: '그곳이 길의 확실한 답이 되는 것' },
    ],
    scene: {
      ref: '누가복음 24:21',
      quote: '우리는 이 사람이 이스라엘을 구속할 자라고 바랐노라',
      scene: '두 사람은 자신들이 무엇을 바랐는지, 그 바람이 어떻게 무너졌는지 이야기한다.',
    },
  },
  {
    number: 3,
    key: 'evidence',
    question: '바란 모양은 아니었지만, 사실 이미 있었던 증거는 무엇인가요?',
    dusk: 0.36,
    options: [
      { id: 'followed', label: '사람들이 내 방식을 실제로 따라준 것', echo: '당신의 방식을 실제로 따라준 사람들' },
      { id: 'results', label: '내 판단이 만들어낸 결과와 숫자들', echo: '당신의 판단이 만들어낸 결과와 숫자들' },
      { id: 'changed_someone', label: '나 때문에 누군가의 관점이 바뀐 것', echo: '당신 때문에 관점이 바뀐 누군가' },
      { id: 'finished_alongside', label: '일과 함께 끝까지 해낸 다른 것 (공부, 개인 프로젝트 등)', echo: '일과 함께 끝까지 해낸 다른 것' },
      { id: 'titled', label: '이미 맡고 있던 역할과 직함 자체', echo: '이미 맡고 있던 역할과 직함' },
    ],
    scene: {
      ref: '누가복음 24:22-24',
      quote: '무덤에 가 과연 여자들의 말한 바와 같음을 보았으나 예수는 보지 못하였느니라',
      scene: '무덤이 비었다는 말을 이미 들었지만, 그들은 그것을 증거로 알아보지 못했다.',
    },
  },
  {
    number: 4,
    key: 'thread',
    question: '처음부터 걸어온 곳들을 적어보세요. 모양만 바뀌어 반복되던 것은 무엇이었나요?',
    hint: '학교, 회사, 프로젝트, 무엇이든 괜찮아요. 순서대로 일곱 곳까지.',
    dusk: 0.52,
    collectsStations: true,
    options: [
      { id: 'set_criteria', label: '근거 없이 흔들리는 것에 기준을 세우는 일', echo: '흔들리는 것에 기준을 세우는 일' },
      { id: 'structure_confusion', label: '사람들이 헤매는 지점을 구조로 정리하는 일' },
      { id: 'reveal_hidden', label: '가려진 것(진짜 원인, 편향)을 드러내는 일', echo: '가려진 것을 드러내는 일' },
      { id: 'translate_between', label: '서로 다른 사람들 사이를 번역하고 잇는 일' },
      { id: 'grow_people', label: '누군가를 돌보고 키우는 일' },
      { id: 'make_first', label: '없던 것을 처음 만들어내는 일' },
    ],
    scene: {
      ref: '누가복음 24:27',
      quote: '모세와 및 모든 선지자의 글로 시작하여 모든 성경에 쓴 바 자기에 관한 것을 자세히 설명하시니라',
      scene: '동행자는 처음부터 다시 읽어 주며, 흩어져 보이던 이야기가 하나였음을 보여 준다.',
    },
  },
  {
    number: 5,
    key: 'burning',
    question: '그땐 그냥 일이었지만, 돌아보니 마음이 뜨거웠던 순간은 언제였나요?',
    dusk: 0.7,
    options: [
      { id: 'wrong_then_saw', label: '내가 틀렸다가 비로소 제대로 보게 된 순간', echo: '당신이 틀렸다가 비로소 제대로 보게 된 순간' },
      { id: 'someone_saw_self', label: '누군가가 스스로를 알아보게 된 순간' },
      { id: 'pieces_connected', label: '흩어진 것들이 하나로 이어진 순간' },
      { id: 'made_something', label: '처음으로 무언가를 세상에 내놓은 순간' },
      { id: 'was_praised', label: '인정받고 칭찬받은 순간' },
    ],
    scene: {
      ref: '누가복음 24:32',
      quote: '길에서 우리에게 말하시고 우리에게 성경을 풀어 주실 때에 우리 속에서 마음이 뜨겁지 아니하더냐',
      scene: '그때는 몰랐지만, 돌아보니 그 길 위에서 이미 마음이 뜨거웠다.',
    },
  },
  {
    number: 6,
    key: 'companions',
    question: '혼자 버틴다고 생각했지만, 사실 함께 걷고 있던 것은 무엇이었나요?',
    dusk: 1,
    options: [
      { id: 'colleagues', label: '틀렸을 때도 다시 믿어준 동료들', short: '다시 믿어준 동료들' },
      { id: 'teachers', label: '배움의 자리에서 만난 스승과 동료들', short: '스승과 동료들' },
      { id: 'words', label: '힘들 때 붙잡고 있던 말이나 신념', echo: '힘들 때 붙잡고 있던 말과 신념', short: '붙잡고 있던 말' },
      { id: 'family_friends', label: '지친 날 곁에 있어준 가족과 친구들', short: '가족과 친구들' },
    ],
    scene: {
      ref: '누가복음 24:29',
      quote: '우리와 함께 유하사이다 때가 저물어가고 날이 이미 기울었나이다',
      scene: '날이 저물자 두 사람은 동행자에게 함께 머물자고 청한다.',
    },
  },
  {
    number: 7,
    key: 'return',
    question: '같은 길을 새로운 눈으로 다시 걷는다면, 무엇이 달라질까요?',
    dusk: 1,
    options: [
      { id: 'choose_role_not_title', label: '더 큰 직함보다 내가 반복해온 일을 할 수 있는 자리를 고른다' },
      { id: 'choose_trusting_org', label: '틀려도 다시 믿어주는 사람들과 일할 수 있는 곳을 고른다' },
      { id: 'work_for_opening', label: '인정받기 위해서가 아니라 누군가의 눈이 열리는 순간을 위해 일한다' },
      { id: 'ending_as_start', label: '지난 곳의 끝을 실패가 아니라 돌아가는 길의 시작으로 받아들인다' },
    ],
    scene: {
      ref: '누가복음 24:33',
      quote: '곧 그 때로 일어나 예루살렘에 돌아가',
      scene: '두 사람은 그 밤에 일어나, 떠나왔던 같은 길을 다시 걸어 돌아간다.',
    },
  },
]

export const MAX_STATIONS = 7

export const stepByKey = Object.fromEntries(steps.map((s) => [s.key, s])) as Record<
  Step['key'],
  Step
>
