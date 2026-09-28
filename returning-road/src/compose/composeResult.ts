import { resultText as T } from '../content/result'
import { stepByKey } from '../content/steps'
import type { Answers, ChoiceKey } from '../content/types'
import { fill, joinList } from '../lib/josa'

export type ParagraphId = 'recurring' | 'hope' | 'path' | 'burning' | 'return'

export interface Practice {
  /** 7단계에서 고른 다짐 (선택지 문장 그대로) */
  intention: string
  /** 그 다짐에 붙는 실천 한 줄 */
  action: string
}

export interface ResultParagraph {
  id: ParagraphId
  text: string
  /** 다섯째 문단에만: 다짐마다 붙는 실천 한 줄 */
  practices?: Practice[]
}

const has = (list: string[], id: string) => list.includes(id)

function optionOf(key: ChoiceKey, id: string) {
  return stepByKey[key].options.find((o) => o.id === id)
}

/** 선택지 id들을 결과 글에 들어갈 2인칭 명사구로 바꾸고, 직접 적은 말을 끝에 붙인다. */
function echoes(answers: Answers, key: ChoiceKey, ids = answers[key]): string[] {
  const phrases = ids
    .map((id) => optionOf(key, id))
    .filter((o) => o !== undefined)
    .map((o) => o.echo ?? o.label)
  const custom = answers.custom?.[key]?.trim()
  if (custom && ids === answers[key]) {
    phrases.push(fill(T.customEcho[key] ?? "'{text}'", { text: custom }))
  }
  return phrases
}

function recurringParagraph(a: Answers): ResultParagraph {
  const quotes = a.recurring
    .map((id) => optionOf('recurring', id)?.label)
    .filter((l): l is string => Boolean(l))
  const custom = a.custom?.recurring?.trim()
  if (custom) quotes.push(custom)

  if (quotes.length === 0) return { id: 'recurring', text: T.recurring.none }

  // 인용한 말이 '-다'로 끝나면 '…다'는, 아니면 '…'라는
  const last = quotes[quotes.length - 1]
  const tail = /다[.。]?$/.test(last) ? '는' : '라는'
  const quoted = `${quotes.map((q) => `'${q}'`).join(', ')}${tail}`
  return {
    id: 'recurring',
    text: `${fill(T.recurring.quoted, { quotes: quoted })} ${T.recurring.turn}`,
  }
}

function hopeParagraph(a: Answers): ResultParagraph {
  const { hope, evidence } = a
  const sentences: string[] = []
  const used = new Set<string>()

  if (has(hope, 'recognition') && (has(evidence, 'titled') || has(evidence, 'followed'))) {
    const where = (['titled', 'followed'] as const).filter((id) => has(evidence, id))
    where.forEach((id) => used.add(id))
    const whereText =
      where.length === 2
        ? `${T.hope.recognitionWhere.titled}도, ${T.hope.recognitionWhere.followed}도요`
        : `${T.hope.recognitionWhere[where[0]]}요`
    sentences.push(fill(T.hope.recognition, { where: whereText }))
  }

  if (has(hope, 'rooted') && has(evidence, 'followed')) {
    used.add('followed')
    sentences.push(T.hope.rooted)
  }

  if (has(hope, 'belonging') && (has(evidence, 'followed') || has(evidence, 'changed_someone'))) {
    const ids = ['followed', 'changed_someone'].filter((id) => has(evidence, id))
    ids.forEach((id) => used.add(id))
    sentences.push(fill(T.hope.belonging, { traces: joinList(echoes(a, 'evidence', ids), '그리고') }))
  }

  const anyEvidence = evidence.length > 0 || Boolean(a.custom?.evidence?.trim())
  if (has(hope, 'certainty') && anyEvidence) {
    sentences.push(T.hope.certainty)
  }

  if (sentences.length === 0) {
    const allEvidence = echoes(a, 'evidence')
    const hopes = echoes(a, 'hope')
    if (allEvidence.length === 0) {
      sentences.push(T.hope.noEvidence)
    } else {
      sentences.push(
        fill(T.hope.fallback, {
          hopes: hopes.length ? joinList(hopes, '또') : '어떤 모양의 내일',
          evidence: joinList(allEvidence),
        }),
      )
    }
  } else if (!has(hope, 'certainty')) {
    // 문장에 쓰이지 않은 나머지 증거도 조용히 호명한다
    const rest = echoes(a, 'evidence', evidence.filter((id) => !used.has(id)))
    const custom = a.custom?.evidence?.trim()
    if (custom) rest.push(fill(T.customEcho.evidence, { text: custom }))
    if (rest.length) sentences.push(fill(T.hope.leftover, { items: joinList(rest) }))
  }

  return { id: 'hope', text: sentences.join(' ') }
}

function pathParagraph(a: Answers): ResultParagraph {
  const stations = a.stations.map((s) => s.trim()).filter(Boolean)
  const threads = echoes(a, 'thread')
  const sentences: string[] = []

  if (stations.length) {
    sentences.push(fill(T.path.stations, { stations: stations.join(', ') }))
    sentences.push(T.path.across)
  } else {
    sentences.push(T.path.acrossNoStations)
  }

  if (threads.length === 0) {
    sentences.push(T.path.none)
  } else {
    // 드러내는 일이 기준을 세우는 일보다 먼저 오도록: 원인을 알아야 기준이 선다
    const ordered = orderThreads(a)
    sentences.push(fill(T.path.threads, { threads: joinList(ordered) }))
    if (has(a.thread, 'reveal_hidden') && has(a.thread, 'set_criteria')) {
      sentences.push(T.path.revealAndCriteria)
    } else if (threads.length > 1) {
      sentences.push(T.path.many)
    } else {
      sentences.push(T.path.one)
    }
  }

  return { id: 'path', text: sentences.join(' ') }
}

function orderThreads(a: Answers): string[] {
  const ids = [...a.thread]
  const r = ids.indexOf('reveal_hidden')
  const c = ids.indexOf('set_criteria')
  if (r > -1 && c > -1 && r > c) {
    ids.splice(r, 1)
    ids.splice(c, 0, 'reveal_hidden')
  }
  const phrases = echoes(a, 'thread', ids)
  const custom = a.custom?.thread?.trim()
  if (custom) phrases.push(fill(T.customEcho.thread, { text: custom }))
  return phrases
}

function burningParagraph(a: Answers): ResultParagraph {
  const { hope, burning } = a
  const praised = has(burning, 'was_praised')
  const others = echoes(a, 'burning', burning.filter((id) => id !== 'was_praised'))
  const custom = a.custom?.burning?.trim()
  if (custom) others.push(fill(T.customEcho.burning, { text: custom }))

  if (!praised && others.length === 0) return { id: 'burning', text: T.burning.none }

  const sentences: string[] = []
  const moments = joinList(others)

  if (praised) {
    sentences.push(others.length ? fill(T.burning.withPraise, { moments }) : T.burning.praiseOnly)
  } else if (has(hope, 'recognition')) {
    sentences.push(fill(T.burning.mismatch, { moments }))
  } else {
    const hopes = echoes(a, 'hope')
    sentences.push(
      hopes.length
        ? fill(T.burning.general, { hopes: joinList(hopes, '또'), moments })
        : fill(T.burning.general, { hopes: '다른 무엇', moments }),
    )
  }

  const self = has(burning, 'wrong_then_saw')
  const other = has(burning, 'someone_saw_self')
  if (self && other) sentences.push(T.burning.eyesBoth)
  else if (self) sentences.push(T.burning.eyesSelf)
  else if (other) sentences.push(T.burning.eyesOther)

  if (!praised) {
    sentences.push(has(hope, 'recognition') ? T.burning.mismatchClose : T.burning.generalClose)
  }

  return { id: 'burning', text: sentences.join(' ') }
}

function returnParagraph(a: Answers): ResultParagraph {
  const companions = echoes(a, 'companions')
  const opening = companions.length
    ? fill(T.return.companions, { companions: joinList(companions) })
    : T.return.noCompanions

  const threads = orderThreads(a)
  const practices: Practice[] = a.return
    .map((id) => {
      const option = optionOf('return', id)
      const template = T.return.practices[id]
      if (!option || !template) return undefined
      return {
        intention: option.label,
        action: fill(template, {
          thread: threads.length ? joinList(threads, '또는') : T.return.threadFallback,
        }),
      }
    })
    .filter((p): p is Practice => p !== undefined)

  const custom = a.custom?.return?.trim()
  if (custom) {
    practices.push({ intention: custom, action: fill(T.return.custom, { text: custom }) })
  }

  return {
    id: 'return',
    text: practices.length ? `${opening} ${T.return.lead}` : opening,
    practices,
  }
}

/** 고른 답들을 엮어 다섯 문단의 결과 글을 만든다. 순수 함수. */
export function composeResult(answers: Answers): ResultParagraph[] {
  return [
    recurringParagraph(answers),
    hopeParagraph(answers),
    pathParagraph(answers),
    burningParagraph(answers),
    returnParagraph(answers),
  ]
}
