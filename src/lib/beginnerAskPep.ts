import { questionIsThyroidTopic, type EvidencePacket, type MeasurementAskContext } from '@/lib/evidenceCompanion';

function list(items: string[], fallback: string): string {
  return items.length ? items.map((item) => `- ${item}`).join('\n') : fallback;
}

function sourceResults(packet: EvidencePacket): string {
  if (!packet.sources.length) return 'No app-verified human source is linked yet, so there is no honest percentage, timeline or guaranteed result to give.';
  return packet.sources.map((source, index) => (
    `**[S${index + 1}] ${source.title}**\n${list(source.findings.slice(0, 4), '- No plain-language result is recorded yet.')}`
  )).join('\n\n');
}

function studyDoses(packet: EvidencePacket): string {
  const sources = packet.sources.filter((source) => source.studiedProtocol);
  if (!sources.length) return 'The app does not have a verified human study dose linked for this compound. Catalogue text and community posts should not be turned into dosing instructions.';
  return sources.map((source) => `- **[S${packet.sources.indexOf(source) + 1}] reported:** ${source.studiedProtocol}`).join('\n');
}

function measurement(context?: MeasurementAskContext): string {
  if (!context) return 'No completed calculator context was supplied.';
  return [
    context.recordedAmount && `Recorded amount: ${context.recordedAmount}`,
    context.schedule && `Recorded schedule: ${context.schedule}`,
    context.vialAmountMg !== undefined && `Vial label: ${context.vialAmountMg} mg`,
    context.diluentMl !== undefined && `Diluent entered: ${context.diluentMl} mL`,
    context.syringe && `Selected syringe: ${context.syringe}`,
    context.calculatedUnits !== undefined && `Calculator result: ${context.calculatedUnits} units`,
    context.calculatedVolumeMl !== undefined && `Calculator volume: ${context.calculatedVolumeMl} mL`,
  ].filter(Boolean).join('\n') || 'No completed calculator context was supplied.';
}

function thyroidAnswer(): string {
  return [
    '**Short answer:** There is no peptide I can honestly recommend as a proven treatment for Hashimoto’s. Current thyroid guidance does not list thymosin alpha-1, KPV, BPC-157, MOTS-c, TB-500, retatrutide—or a combination of them—as an established Hashimoto’s treatment. [S1] [S2]',
    '### About the antibody-drop story\nA 30% antibody reduction is a real lab change and it is reasonable to feel encouraged by it. But because several compounds and a nicotine patch were added across a few weeks, that result cannot show which item caused the change—or whether the change came from the stack at all. Antibody levels, weight, thyroid medication, illness, supplements, timing and normal test variation can all move during the same period. A second similar confession makes this a useful question to study; it still does not make the protocol proven or safe to copy.',
    '### What we can say about those compounds\n- **Thymosin alpha-1:** it changes immune signalling, but I could not verify a reliable controlled human trial showing that it treats Hashimoto’s or improves thyroid function.\n- **KPV, BPC-157 and TB-500:** evidence for Hashimoto’s treatment is absent or preclinical; community use is not clinical proof.\n- **MOTS-c:** a 2026 cross-sectional study found an association between Hashimoto’s and lower circulating MOTS-c. Researchers did **not** give people MOTS-c, so the study does not show that taking it lowers antibodies or treats Hashimoto’s. [S3]\n- **Retatrutide:** an investigational obesity medicine, not a Hashimoto’s treatment. Weight and metabolic changes can happen alongside thyroid-lab changes without proving a direct thyroid effect.\n- **Nicotine patch:** not a peptide and not an established thyroid treatment; it has its own cardiovascular, sleep and dependence risks.',
    '### What matters more than chasing the antibody number\nFor someone already diagnosed, the American Thyroid Association says repeating thyroid-antibody levels is generally not needed; **TSH and free T4**, symptoms and medication needs are more useful for follow-up. If hypothyroidism is present, levothyroxine is the standard replacement treatment. [S1] [S2]',
    '### A sensible next step\nTake the full timeline to an endocrinologist: baseline and follow-up TSH, free T4, antibody values, symptoms, weight change, thyroid-medication dose, supplements and when each compound started. Ask: “Did my thyroid function improve, or did only the antibody number move?” Do not stop or alter prescribed thyroid medicine from a confession or app answer. Seek prompt medical advice for a new neck swelling, trouble swallowing, marked palpitations, fainting, severe weakness, or if pregnant or trying to conceive.',
    'The confession is valuable as a **signal for a research question**, not as a dosing template. PepSA can help you organise the timeline and questions, but it should not turn this stack into a recommendation.',
  ].join('\n\n');
}

/**
 * Release-resilient local renderer. The authenticated edge function still
 * enforces privacy and rate limits; this keeps the beginner voice available
 * while a newly committed function version is rolling out.
 */
export function buildBeginnerAskPepAnswer(
  question: string,
  packet: EvidencePacket,
  personalDoseDeclined: boolean,
  measurementContext?: MeasurementAskContext,
): string {
  if (questionIsThyroidTopic(question)) return thyroidAnswer().slice(0, 6000);

  const q = question.toLowerCase();
  const asksDose = /\b(dose|dosage|how much|how often|frequency|titration|protocol)\b/.test(q);
  const asksResults = /\b(results?|expect|timeline|weight|fat loss|benefit|effective|work|notice|how long)\b/.test(q);
  const asksSideEffects = /\b(side effects?|risk|safe|safety|nausea|vomit|constipation|diarrh|headache|adverse|tired|fatigue|cold|emotion|depress|appetite|weak|muscle)\b/.test(q);
  const asksStack = /\b(stack|combine|pair|mix|switch|together)\b/.test(q);
  const asksStop = /\b(stop|stopping|come off|regain|rebound|withdraw)\b/.test(q);
  const asksMeasurement = /\b(my|recorded|calculator|calculation|measurement|syringe|units?|diluent|vial)\b/.test(q);
  const sections: string[] = [];

  if (personalDoseDeclined) {
    sections.push('I can’t choose or recommend a personal dose, schedule, cycle, route, syringe, stack, or treatment. I can show what named sources studied and explain an already-recorded calculation without changing it.');
  }

  sections.push(`**Short answer:** ${packet.beginner.simpleExplanation}\n\n**Where it stands:** ${packet.beginner.status}.`);

  if (asksMeasurement) sections.push(`### Your recorded calculation\n${measurement(measurementContext)}\n\nI have explained the values already entered; I have not changed the amount or created a new protocol.`);
  if (asksDose || personalDoseDeclined) sections.push(`### Doses researchers studied\n${studyDoses(packet)}\n\nThat describes a study, not a dose for you.`);
  if (asksResults) sections.push(`### What human studies reported\n${sourceResults(packet)}\n\nGroup averages are not promises, and the same timeline will not apply to everyone.`);
  if (asksSideEffects) sections.push(`### Side effects and warning signs\n${list(packet.beginner.safetyFlags, 'The safety summary is still incomplete. Unknown does not mean safe.')}\n\nExhaustion, feeling unusually cold or emotionally flat, weakness, dizziness, or being unable to eat or drink enough is not proof that it is working. Contact a clinician. Seek urgent care for fainting, severe or persistent abdominal pain, repeated vomiting, dehydration, chest pain, breathing difficulty, confusion, or thoughts of self-harm.`);
  if (asksStack) sections.push('### Stacking or switching\nUnless a linked study tested the exact combination, evidence for each ingredient does not prove the stack is safe or effective. Combining compounds can also make it harder to identify what caused a side effect, so I will not invent a crossover schedule.');
  if (asksStop) sections.push('### Stopping\nAn on-treatment trial does not predict exactly what will happen after one person stops. Appetite, weight and side effects may change again. A clinician-led plan should consider nutrition, hydration, mood, other medicines and the reason for stopping.');

  if (!asksDose && !asksResults && !asksSideEffects && !asksStack && !asksStop && !asksMeasurement) {
    sections.push(`### What it is commonly discussed for\n${list(packet.beginner.discussedFor, 'No clear human use has been verified yet.')}\n\nThese are discussion points, not proof that it will work for every person.`);
    sections.push(`### The evidence in one line\n**${packet.evidenceLabel}.** ${packet.evidenceNote}`);
  }

  sections.push('Community stories are useful for finding the questions people forget to ask, but they cannot prove cause, safety or the right dose. For a personal decision, take the linked source and your symptoms or recorded plan to a qualified healthcare professional.');
  return sections.join('\n\n').slice(0, 6000);
}
