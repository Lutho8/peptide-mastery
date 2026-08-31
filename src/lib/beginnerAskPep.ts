import type { EvidencePacket, MeasurementAskContext } from '@/lib/evidenceCompanion';

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
