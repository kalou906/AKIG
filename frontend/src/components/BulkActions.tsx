import React from 'react';

/**
 * Props pour les actions en masse
 */
export interface BulkActionProps {
  selectedItems: any[];
  onAction: (action: string, items: any[]) => void | Promise<void>;
  actions: Array<{
    label: string;
    icon?: string;
    action: string;
    color?: 'primary' | 'danger' | 'warning' | 'success';
    requiresConfirm?: boolean;
  }>;
  isLoading?: boolean;
}

/**
 * Composant pour les actions en masse (batch operations)
 *
 * Permet de sélectionner plusieurs items et d'effectuer des actions
 *
 * Exemple :
 * <BulkActions
 *   selectedItems={selected}
 *   actions={[
 *     { label: 'Supprimer', action: 'delete', color: 'danger' },
 *     { label: 'Exporter', action: 'export' }
 *   ]}
 *   onAction={handleBulkAction}
 * />
 */
export function BulkActions({
  selectedItems,
  onAction,
  actions,
  isLoading = false,
}: BulkActionProps): React.ReactElement | null {
  const [loading, setLoading] = React.useState(false);

  if (selectedItems.length === 0) {
    return null;
  }

  const getColorClass = (color?: string) => {
    switch (color) {
      case 'danger':
        return 'bg-red-600 hover:bg-red-700';
      case 'warning':
        return 'bg-yellow-600 hover:bg-yellow-700';
      case 'success':
        return 'bg-green-600 hover:bg-green-700';
      default:
        return 'bg-blue-600 hover:bg-blue-700';
    }
  };

  const handleAction = async (action: string, requiresConfirm?: boolean) => {
    if (requiresConfirm) {
      const confirmed = window.confirm(
        `Êtes-vous certain de cette action ? (${selectedItems.length} items)`
      );
      if (!confirmed) return;
    }

    setLoading(true);
    try {
      await onAction(action, selectedItems);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center justify-between">
      <div className="text-sm text-blue-700 font-medium">
        {selectedItems.length} item{selectedItems.length !== 1 ? 's' : ''} sélectionné{selectedItems.length !== 1 ? 's' : ''}
      </div>

      <div className="flex gap-2">
        {actions.map((action) => (
          <button
            key={action.action}
            onClick={() => handleAction(action.action, action.requiresConfirm)}
            disabled={loading || isLoading}
            className={`px-3 py-2 text-sm text-white rounded transition disabled:opacity-50 ${getColorClass(
              action.color
            )}`}
          >
            {action.icon && <span className="mr-1">{action.icon}</span>}
            {action.label}
          </button>
        ))}
      </div>
    </div>
  );
}

/**
 * Hook pour gérer la sélection en masse
 */
export interface UseBulkSelectionReturn {
  selectedItems: any[];
  isAllSelected: boolean;
  toggleItem: (item: any) => void;
  toggleAll: (items: any[]) => void;
  clearSelection: () => void;
  addItems: (items: any[]) => void;
  removeItems: (items: any[]) => void;
}

export function useBulkSelection(): UseBulkSelectionReturn {
  const [selectedItems, setSelectedItems] = React.useState<any[]>([]);

  const toggleItem = (item: any) => {
    setSelectedItems((prev) => {
      const isSelected = prev.some((i) => i.id === item.id);
      if (isSelected) {
        return prev.filter((i) => i.id !== item.id);
      } else {
        return [...prev, item];
      }
    });
  };

  const toggleAll = (items: any[]) => {
    const isAllSelected = selectedItems.length === items.length;
    if (isAllSelected) {
      setSelectedItems([]);
    } else {
      setSelectedItems(items);
    }
  };

  const clearSelection = () => {
    setSelectedItems([]);
  };

  const addItems = (items: any[]) => {
    setSelectedItems((prev) => {
      const newItems = items.filter((item) => !prev.some((i) => i.id === item.id));
      return [...prev, ...newItems];
    });
  };

  const removeItems = (items: any[]) => {
    setSelectedItems((prev) => prev.filter((p) => !items.some((i) => i.id === p.id)));
  };

  return {
    selectedItems,
    isAllSelected: selectedItems.length > 0,
    toggleItem,
    toggleAll,
    clearSelection,
    addItems,
    removeItems,
  };
}

/**
 * Composant checkbox pour la sélection
 */
export interface BulkSelectCheckboxProps {
  checked: boolean;
  indeterminate?: boolean;
  onChange: (checked: boolean) => void;
}

export function BulkSelectCheckbox({
  checked,
  indeterminate = false,
  onChange,
}: BulkSelectCheckboxProps): React.ReactElement {
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (inputRef.current) {
      inputRef.current.indeterminate = indeterminate;
    }
  }, [indeterminate]);

  return (
    <input
      ref={inputRef}
      type="checkbox"
      checked={checked}
      onChange={(e) => onChange(e.target.checked)}
      className="w-4 h-4 rounded border-gray-300 focus:ring-blue-500 cursor-pointer"
    />
  );
}

/**
 * Composant tableau avec sélection en masse intégrée
 */
export interface SelectableTableRowProps {
  item: any;
  isSelected: boolean;
  onToggle: (item: any) => void;
  children: React.ReactNode;
}

export function SelectableTableRow({
  item,
  isSelected,
  onToggle,
  children,
}: SelectableTableRowProps): React.ReactElement {
  return (
    <tr className={isSelected ? 'bg-blue-50' : ''}>
      <td className="px-4 py-2 w-12">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => onToggle(item)}
          className="w-4 h-4 rounded border-gray-300 focus:ring-blue-500 cursor-pointer"
        />
      </td>
      {children}
    </tr>
  );
}

/**
 * Menu d'actions rapides pour les items
 */
export interface ContextMenuProps {
  items: Array<{
    label: string;
    icon?: string;
    action: string;
    color?: 'primary' | 'danger' | 'warning' | 'success';
  }>;
  onAction: (action: string) => void;
  x: number;
  y: number;
}

export function ContextMenu({
  items,
  onAction,
  x,
  y,
}: ContextMenuProps): React.ReactElement {
  const getColorClass = (color?: string) => {
    switch (color) {
      case 'danger':
        return 'text-red-600 hover:bg-red-50';
      case 'warning':
        return 'text-yellow-600 hover:bg-yellow-50';
      case 'success':
        return 'text-green-600 hover:bg-green-50';
      default:
        return 'text-blue-600 hover:bg-blue-50';
    }
  };

  return (
    <div
      className="fixed bg-white border border-gray-200 rounded shadow-lg z-50"
      style={{ top: `${y}px`, left: `${x}px` }}
    >
      {items.map((item) => (
        <button
          key={item.action}
          onClick={() => onAction(item.action)}
          className={`block w-full text-left px-4 py-2 text-sm ${getColorClass(item.color)} transition`}
        >
          {item.icon && <span className="mr-2">{item.icon}</span>}
          {item.label}
        </button>
      ))}
    </div>
  );
}

/**
 * Hook pour gérer un menu contextuel
 */
export interface UseContextMenuReturn {
  isOpen: boolean;
  x: number;
  y: number;
  openMenu: (e: React.MouseEvent) => void;
  closeMenu: () => void;
}

export function useContextMenu(): UseContextMenuReturn {
  const [isOpen, setIsOpen] = React.useState(false);
  const [x, setX] = React.useState(0);
  const [y, setY] = React.useState(0);

  React.useEffect(() => {
    const handleClick = () => setIsOpen(false);
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  const openMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setX(e.clientX);
    setY(e.clientY);
    setIsOpen(true);
  };

  const closeMenu = () => {
    setIsOpen(false);
  };

  return { isOpen, x, y, openMenu, closeMenu };
}
