import type { Student } from '@/lib/types';
import AddStudentsModal from '@/components/modals/AddStudentsModal';
import AwardPointsModal from '@/components/modals/AwardPointsModal';
import EditStudentModal from '@/components/modals/EditStudentModal';
import PointsAwardedConfirmationModal from '@/components/modals/PointsAwardedConfirmationModal';
import type { AwardPointsInfo } from '@/hooks/useAwardPointsFlow';

interface StudentsModalsProps {
  classId: string;
  className: string;
  classIcon: string;
  students: Student[];
  selectedStudent: Student | null;
  editingStudent: Student | null;
  selectedStudentIds: string[];
  awardInfo: AwardPointsInfo | null;
  isAddStudentModalOpen: boolean;
  isPointsModalOpen: boolean;
  isWholeClassModalOpen: boolean;
  isEditStudentModalOpen: boolean;
  isMultiStudentAwardModalOpen: boolean;
  isConfirmationModalOpen: boolean;
  onStudentAdded: () => void;
  onCloseAddStudentsModal: () => void;
  onClosePointsModal: () => void;
  onCloseWholeClassModal: () => void;
  onCloseEditStudentModal: () => void;
  onCloseMultiStudentAwardModal: () => void;
  onCloseConfirmationModal: () => void;
  onAwardComplete: (selectedIds: string[], type: 'classes' | 'students') => void;
  onPointsAwarded: (info: AwardPointsInfo) => void;
}

export default function StudentsModals({
  classId,
  className,
  classIcon,
  students,
  selectedStudent,
  editingStudent,
  selectedStudentIds,
  awardInfo,
  isAddStudentModalOpen,
  isPointsModalOpen,
  isWholeClassModalOpen,
  isEditStudentModalOpen,
  isMultiStudentAwardModalOpen,
  isConfirmationModalOpen,
  onStudentAdded,
  onCloseAddStudentsModal,
  onClosePointsModal,
  onCloseWholeClassModal,
  onCloseEditStudentModal,
  onCloseMultiStudentAwardModal,
  onCloseConfirmationModal,
  onAwardComplete,
  onPointsAwarded,
}: StudentsModalsProps) {
  return (
    <>
      <AddStudentsModal
        isOpen={isAddStudentModalOpen}
        onClose={onCloseAddStudentsModal}
        classId={classId}
        onStudentAdded={onStudentAdded}
      />

      {selectedStudent && (
        <AwardPointsModal
          isOpen={isPointsModalOpen}
          onClose={onClosePointsModal}
          student={selectedStudent}
          classId={classId}
          onRefresh={onStudentAdded}
          onPointsAwarded={onPointsAwarded}
        />
      )}

      <AwardPointsModal
        isOpen={isWholeClassModalOpen}
        onClose={onCloseWholeClassModal}
        student={null}
        classId={classId}
        className={className}
        classIcon={classIcon}
        onRefresh={onStudentAdded}
        onPointsAwarded={onPointsAwarded}
      />

      {selectedStudentIds.length > 0 && (
        <AwardPointsModal
          isOpen={isMultiStudentAwardModalOpen}
          onClose={onCloseMultiStudentAwardModal}
          student={null}
          classId={classId}
          selectedStudentIds={selectedStudentIds}
          onAwardComplete={onAwardComplete}
          onRefresh={onStudentAdded}
          onPointsAwarded={onPointsAwarded}
        />
      )}

      <EditStudentModal
        isOpen={isEditStudentModalOpen}
        onClose={onCloseEditStudentModal}
        student={editingStudent}
        onRefresh={onStudentAdded}
      />

      {awardInfo && (
        <PointsAwardedConfirmationModal
          isOpen={isConfirmationModalOpen}
          onClose={onCloseConfirmationModal}
          studentAvatar={awardInfo.studentAvatar}
          studentFirstName={awardInfo.studentFirstName}
          points={awardInfo.points}
          categoryName={awardInfo.categoryName}
          categoryIcon={awardInfo.categoryIcon}
        />
      )}
    </>
  );
}

