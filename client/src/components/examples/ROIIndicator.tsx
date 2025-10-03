import { ROIIndicator } from "../ROIIndicator";

export default function ROIIndicatorExample() {
  return (
    <div className="p-4 flex flex-col gap-6">
      <ROIIndicator roi={25.4} size="lg" />
      <ROIIndicator roi={-12.3} size="md" />
      <ROIIndicator roi={5.67} size="sm" />
    </div>
  );
}
