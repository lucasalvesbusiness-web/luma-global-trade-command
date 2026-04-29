import { describe, expect, it } from 'vitest';

import {
  allowedNextStatuses,
  isTransitionAllowed,
  kanbanColumns,
  teamRelevantStatuses,
  transitionMap,
} from '@/server/services/proposal-workflow';
import type { ProposalStatus, StaffTeam } from '@/server/repositories/types';

const ALL_STATUSES: ProposalStatus[] = [
  'DRAFT',
  'SUBMITTED',
  'UNDER_COMMERCIAL_REVIEW',
  'UNDER_OPERATIONAL_REVIEW',
  'DOCUMENTATION_REVIEW_REQUIRED',
  'ADJUSTMENT_REQUESTED',
  'APPROVED_FOR_NEGOTIATION',
  'REJECTED',
  'CONVERTED_TO_OPERATION',
];

const TERMINAL: ProposalStatus[] = ['DRAFT', 'REJECTED', 'CONVERTED_TO_OPERATION'];

describe('transitionMap shape', () => {
  it('has an entry for every ProposalStatus', () => {
    for (const s of ALL_STATUSES) {
      expect(transitionMap[s]).toBeDefined();
    }
  });

  it('terminal statuses have no outgoing transitions', () => {
    for (const s of TERMINAL) {
      expect(transitionMap[s]).toEqual([]);
    }
  });

  it('every transition target is a valid ProposalStatus', () => {
    for (const rules of Object.values(transitionMap)) {
      for (const r of rules) {
        expect(ALL_STATUSES).toContain(r.to);
      }
    }
  });

  it('every transition lists at least one allowed team', () => {
    for (const rules of Object.values(transitionMap)) {
      for (const r of rules) {
        expect(r.allowedTeams.length).toBeGreaterThan(0);
      }
    }
  });
});

describe('allowedNextStatuses', () => {
  it('ADMIN sees every rule defined for the source status', () => {
    const all = allowedNextStatuses('UNDER_COMMERCIAL_REVIEW', 'ADMIN');
    expect(all).toEqual(transitionMap.UNDER_COMMERCIAL_REVIEW);
  });

  it('COMMERCIAL cannot start operational review flows not granted to it', () => {
    const fromDocReview = allowedNextStatuses(
      'DOCUMENTATION_REVIEW_REQUIRED',
      'COMMERCIAL',
    );
    // doc review está restrito a COMPLIANCE/ADMIN — commercial não vê nada aqui
    expect(fromDocReview).toEqual([]);
  });

  it('COMPLIANCE cannot triage SUBMITTED proposals', () => {
    const fromSubmitted = allowedNextStatuses('SUBMITTED', 'COMPLIANCE');
    expect(fromSubmitted).toEqual([]);
  });

  it('OPERATIONS can send proposal to compliance from operational review', () => {
    const rules = allowedNextStatuses('UNDER_OPERATIONAL_REVIEW', 'OPERATIONS');
    expect(rules.map((r) => r.to)).toContain('DOCUMENTATION_REVIEW_REQUIRED');
    expect(rules.map((r) => r.to)).toContain('APPROVED_FOR_NEGOTIATION');
  });

  it('terminal statuses return empty list for any team', () => {
    const teams: (StaffTeam | null)[] = [
      'COMMERCIAL',
      'OPERATIONS',
      'COMPLIANCE',
      'ADMIN',
      null,
    ];
    for (const t of teams) {
      for (const s of TERMINAL) {
        expect(allowedNextStatuses(s, t)).toEqual([]);
      }
    }
  });

  it('only COMMERCIAL/ADMIN can convert APPROVED_FOR_NEGOTIATION into an operation', () => {
    expect(
      allowedNextStatuses('APPROVED_FOR_NEGOTIATION', 'COMMERCIAL').map(
        (r) => r.to,
      ),
    ).toContain('CONVERTED_TO_OPERATION');
    expect(
      allowedNextStatuses('APPROVED_FOR_NEGOTIATION', 'OPERATIONS').map(
        (r) => r.to,
      ),
    ).not.toContain('CONVERTED_TO_OPERATION');
    expect(
      allowedNextStatuses('APPROVED_FOR_NEGOTIATION', 'COMPLIANCE').map(
        (r) => r.to,
      ),
    ).not.toContain('CONVERTED_TO_OPERATION');
  });
});

describe('isTransitionAllowed', () => {
  it('returns true for a valid team-gated transition', () => {
    expect(
      isTransitionAllowed('SUBMITTED', 'UNDER_COMMERCIAL_REVIEW', 'COMMERCIAL'),
    ).toBe(true);
  });

  it('returns false when team is not permitted for the rule', () => {
    expect(
      isTransitionAllowed('SUBMITTED', 'UNDER_COMMERCIAL_REVIEW', 'COMPLIANCE'),
    ).toBe(false);
  });

  it('returns false when the target status has no rule from the source', () => {
    expect(
      isTransitionAllowed('SUBMITTED', 'CONVERTED_TO_OPERATION', 'ADMIN'),
    ).toBe(false);
  });

  it('returns false for any transition out of a terminal status', () => {
    for (const s of TERMINAL) {
      for (const t of ALL_STATUSES) {
        expect(isTransitionAllowed(s, t, 'ADMIN')).toBe(false);
      }
    }
  });

  it('ADMIN can drive any rule even when not listed in allowedTeams', () => {
    // ADJUSTMENT_REQUESTED → UNDER_COMMERCIAL_REVIEW só tem COMMERCIAL/ADMIN
    expect(
      isTransitionAllowed(
        'ADJUSTMENT_REQUESTED',
        'UNDER_COMMERCIAL_REVIEW',
        'ADMIN',
      ),
    ).toBe(true);
  });

  it('all four teams can reject from ADJUSTMENT_REQUESTED', () => {
    const teams: StaffTeam[] = ['COMMERCIAL', 'OPERATIONS', 'COMPLIANCE', 'ADMIN'];
    for (const t of teams) {
      expect(isTransitionAllowed('ADJUSTMENT_REQUESTED', 'REJECTED', t)).toBe(
        true,
      );
    }
  });
});

describe('kanbanColumns', () => {
  it('covers every non-DRAFT status exactly once', () => {
    const expected = ALL_STATUSES.filter((s) => s !== 'DRAFT');
    expect([...kanbanColumns].sort()).toEqual([...expected].sort());
  });

  it('starts with SUBMITTED and ends with REJECTED', () => {
    expect(kanbanColumns[0]).toBe('SUBMITTED');
    expect(kanbanColumns[kanbanColumns.length - 1]).toBe('REJECTED');
  });
});

describe('teamRelevantStatuses', () => {
  it('has entries for all four teams', () => {
    expect(Object.keys(teamRelevantStatuses).sort()).toEqual(
      ['ADMIN', 'COMMERCIAL', 'COMPLIANCE', 'OPERATIONS'].sort(),
    );
  });

  it('COMPLIANCE only cares about documentation review', () => {
    expect(teamRelevantStatuses.COMPLIANCE).toEqual([
      'DOCUMENTATION_REVIEW_REQUIRED',
    ]);
  });

  it('ADMIN sees every non-DRAFT status', () => {
    const expected = ALL_STATUSES.filter((s) => s !== 'DRAFT');
    expect([...teamRelevantStatuses.ADMIN].sort()).toEqual(
      [...expected].sort(),
    );
  });
});
