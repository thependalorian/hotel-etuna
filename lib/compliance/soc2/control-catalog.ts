/**
 * SOC 2 control catalog — thin re-export layer (DRY).
 * Location: lib/compliance/soc2/control-catalog.ts
 *
 * - Static control definitions + auditor prompts: nayaone-tsc-framework.ts
 * - Runtime seed/scoring + orchestrator scope: control-matrix.ts
 */

export type { Soc2ControlDefinition } from './nayaone-tsc-framework';
export {
  HOTEL_ETUNA_SOC2_CONTROLS as SOC2_CONTROL_CATALOG,
  HOTEL_ETUNA_SOC2_CONTROLS,
  SOC2_AUDITOR_INTERVIEW_PROMPTS,
} from './nayaone-tsc-framework';
export {
  SOC2_FRAMEWORK_REFERENCE,
  HOTEL_ETUNA_SOC2_SCOPE,
  seedControls,
  scoreControls,
  summarizeControls,
} from './control-matrix';
