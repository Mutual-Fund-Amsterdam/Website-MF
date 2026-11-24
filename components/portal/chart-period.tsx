"use client";

import * as Select from "@radix-ui/react-select";
import { Check, ChevronDown } from "lucide-react";
import { useId } from "react";

export default function ChartPeriod<T extends string>({ value, options, onChange }: {
  value:T; options:readonly (readonly [T,string])[]; onChange:(value:T)=>void;
}) {
  const labelId = useId();
  return <div className="mf-period">
    <span id={labelId}>Periode</span>
    <Select.Root value={value} onValueChange={next => {
      const selected = options.find(([key]) => key === next);
      if (selected) onChange(selected[0]);
    }}>
      <Select.Trigger aria-labelledby={labelId} className="mf-period-trigger">
        <Select.Value/><Select.Icon asChild><ChevronDown size={15} /></Select.Icon>
      </Select.Trigger>
      <Select.Content position="popper" sideOffset={5} collisionPadding={12} className="mf-period-menu">
        <Select.Viewport>{options.map(([key,label]) =>
          <Select.Item key={key} value={key} className="mf-period-option">
            <Select.ItemText>{label}</Select.ItemText>
            <Select.ItemIndicator><Check size={15} /></Select.ItemIndicator>
          </Select.Item>
        )}</Select.Viewport>
      </Select.Content>
    </Select.Root>
  </div>;
}
export const calendarPeriods = [["all","Hele periode"],["30","30 dagen"],["7","7 dagen"]] as const;
export type CalendarPeriod = typeof calendarPeriods[number][0];
export function visibleDays<T extends {timestamp:number}>(days:T[],period:CalendarPeriod) {
  const end=days.at(-1)?.timestamp;
  return period === "all" || end === undefined ? days : days.filter(row=>row.timestamp >= end-(Number(period)-1)*86400000);
}
