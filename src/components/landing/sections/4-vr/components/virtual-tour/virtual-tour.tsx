import DragInstructionIcon from "@/components/ui/virtual-tour/components/drag-instruction-icon/drag-instruction-icon";
import VirtualTourClient, {
  type VirtualTourLabels,
} from "@/components/ui/virtual-tour/virtual-tour-client";
import styles from "./virtual-tour.module.css";

export default function VirtualTour({
  labels,
  dragLabel,
}: {
  labels: VirtualTourLabels;
  dragLabel: string;
}) {
  return (
    <div className={styles.virtualTour} data-vr-tour-section>
      <VirtualTourClient labels={labels}>
        <DragInstructionIcon label={dragLabel} />
      </VirtualTourClient>
    </div>
  );
}
