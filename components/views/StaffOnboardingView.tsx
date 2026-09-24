import React from 'react';
import { StaffCard } from '../../data/initialData';

interface StaffOnboardingViewProps {
  staff: StaffCard[];
  onOpenAddStaffModal: () => void;
  onMoveStage: (staffId: string, direction: 'next' | 'prev') => void;
}

export default function StaffOnboardingView({
  staff,
  onOpenAddStaffModal,
  onMoveStage
}: StaffOnboardingViewProps) {
  const stages: Array<StaffCard['stage']> = ['Applied', 'Documents', 'Training', 'Active'];

  return (
    <>
      <div className="page-toolbar">
        <div></div>
        <button className="btn-primary" onClick={onOpenAddStaffModal}>
          + Add Staff Member
        </button>
      </div>

      <div className="kanban">
        {stages.map((st) => {
          const stageCards = staff.filter((s) => s.stage === st);
          return (
            <div key={st} className="kanban-col">
              <div className="kanban-col-head">
                {st} <span className="n">{stageCards.length}</span>
              </div>

              {stageCards.map((card) => (
                <div key={card.id} className="kanban-card">
                  <div className="kname">{card.name}</div>
                  <div className="krole">{card.role}</div>
                  <div className="kanban-actions">
                    {st !== 'Applied' && (
                      <button
                        className="kanban-btn"
                        onClick={() => onMoveStage(card.id, 'prev')}
                        title="Move to Previous Stage"
                      >
                        ← Prev
                      </button>
                    )}
                    {st !== 'Active' && (
                      <button
                        className="kanban-btn"
                        onClick={() => onMoveStage(card.id, 'next')}
                        title="Advance to Next Stage"
                        style={{ marginLeft: 'auto' }}
                      >
                        Advance →
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </>
  );
}
