import { PRODUCT_CONDITIONS } from '../../constants/conditions';

interface FilterSidebarProps {
  sort: string;
  onSortChange: (sort: string) => void;
  selectedConditions: string[];
  onConditionsChange: (conditions: string[]) => void;
  conditionCounts: Record<string, number>;
}

export const FilterSidebar = ({
  sort,
  onSortChange,
  selectedConditions,
  onConditionsChange,
  conditionCounts,
}: FilterSidebarProps) => {
  const handleConditionToggle = (condition: string) => {
    if (selectedConditions.includes(condition)) {
      onConditionsChange(selectedConditions.filter((c) => c !== condition));
    } else {
      onConditionsChange([...selectedConditions, condition]);
    }
  };

  return (
    <div className="space-y-6">
      {/* Sort By */}
      <div>
        <label
          htmlFor="sort-select"
          className="block text-sm font-medium text-text-secondary mb-2"
        >
          Sort By
        </label>
        <select
          id="sort-select"
          value={sort}
          onChange={(e) => onSortChange(e.target.value)}
          className="w-full px-3 py-2 bg-dark-elevated border border-dark-border rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-orange focus:border-transparent transition-all duration-200"
        >
          <option value="newest">Newest</option>
          <option value="oldest">Oldest</option>
          <option value="title_asc">A-Z</option>
          <option value="title_desc">Z-A</option>
          <option value="price_asc">Price: Low to High</option>
          <option value="price_desc">Price: High to Low</option>
        </select>
      </div>

      {/* Condition */}
      <div>
        <span className="block text-sm font-medium text-text-secondary mb-2">Condition</span>
        <div className="space-y-2">
          {PRODUCT_CONDITIONS.map((condition) => (
            <label
              key={condition}
              className="flex items-center gap-2 cursor-pointer group"
            >
              <input
                type="checkbox"
                checked={selectedConditions.includes(condition)}
                onChange={() => handleConditionToggle(condition)}
                className="w-4 h-4 rounded border-dark-border bg-dark-elevated accent-orange-500 focus:ring-2 focus:ring-orange focus:ring-offset-0"
              />
              <span className="text-sm text-text-primary group-hover:text-orange transition-colors">
                {condition}
                <span className="text-text-muted ml-1">({conditionCounts[condition] ?? 0})</span>
              </span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
};
