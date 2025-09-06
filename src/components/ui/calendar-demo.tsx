import Component from "@/components/ui/calendar-1";

export default function CalendarBasic() {
  return (
    <div className="p-4">
      <Component
        mode="single"
        numberOfMonths={1}
        className="max-w-fit"
        // onSelect={(date) => console.log(date)}
      />
    </div>
  );
}
