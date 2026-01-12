import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ShoppingCart, Recycle, Trash2 } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const INITIAL_ITEMS = [
  {
    id: 1,
    title: 'Plastic Bottle Planter Kit',
    description: 'Soil, seeds and guide to turn used bottles into planters.',
    icon: '🪴',
    points: 10,
  },
  {
    id: 2,
    title: 'Cardboard Organizer Set',
    description: 'DIY templates to convert boxes into desk organizers.',
    icon: '📦',
    points: 8,
  },
  {
    id: 3,
    title: 'Upcycled T-Shirt Bag',
    description: 'Pattern to convert old t-shirts into shopping bags.',
    icon: '👕',
    points: 6,
  },
];

export default function Cart() {
  const { darkMode, colors } = useTheme();
  const [items, setItems] = useState([]);

  useEffect(() => {
    const saved = localStorage.getItem('eco_cart_items');
    if (saved) {
      setItems(JSON.parse(saved));
    } else {
      setItems(INITIAL_ITEMS.map(i => ({ ...i, quantity: 1 })));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('eco_cart_items', JSON.stringify(items));
  }, [items]);

  const updateQuantity = (id, delta) => {
    setItems(prev => prev
      .map(item => item.id === id ? { ...item, quantity: Math.max(0, (item.quantity || 0) + delta) } : item)
      .filter(item => item.quantity > 0)
    );
  };

  const clearCart = () => {
    setItems([]);
  };

  const totalPoints = items.reduce((sum, item) => sum + (item.points || 0) * (item.quantity || 0), 0);

  return (
    <div className="px-4 pt-4 pb-24 max-w-lg mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`${colors.surface} rounded-3xl shadow-lg border ${colors.border} overflow-hidden`}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-500 to-green-600 p-4 flex items-center gap-3 text-white">
          <div className="w-11 h-11 rounded-2xl bg-white/20 flex items-center justify-center">
            <ShoppingCart size={26} />
          </div>
          <div>
            <h1 className="text-lg font-bold">Eco Cart</h1>
            <p className="text-xs text-white/80">Save recycling projects you want to try later</p>
          </div>
        </div>

        {/* Items */}
        <div className={`p-4 space-y-3 ${darkMode ? 'bg-gray-900' : 'bg-slate-50'}`}>
          {items.length === 0 ? (
            <div className={`${colors.surface} rounded-2xl p-6 text-center border ${colors.border}`}>
              <Recycle className="mx-auto mb-2 text-emerald-500" />
              <p className={colors.text}>Your cart is empty.</p>
              <p className={`${colors.textSecondary} text-xs mt-1`}>
                Add ideas from the chatbot and turn waste into something useful.
              </p>
            </div>
          ) : (
            items.map((item) => (
              <div
                key={item.id}
                className={`${colors.surface} rounded-2xl p-3 flex items-center gap-3 border ${colors.border}`}
              >
                <div className="w-10 h-10 rounded-2xl bg-emerald-100 flex items-center justify-center text-lg">
                  {item.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start gap-2">
                    <div className="min-w-0">
                      <p className={`text-sm font-semibold ${colors.text} truncate`}>{item.title}</p>
                      <p className={`text-[11px] ${colors.textSecondary} truncate`}>{item.description}</p>
                    </div>
                    <span className="text-[11px] text-emerald-600 font-semibold whitespace-nowrap">+{item.points} pts</span>
                  </div>

                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center gap-2 text-[11px] text-gray-500">
                      <Trash2 size={12} className="opacity-60" />
                      <span>From recycled materials</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.id, -1)}
                        className="w-6 h-6 rounded-full bg-slate-200 text-xs flex items-center justify-center"
                      >
                        -
                      </button>
                      <span className={`text-xs font-semibold ${colors.text}`}>
                        {item.quantity || 0}
                      </span>
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.id, 1)}
                        className="w-6 h-6 rounded-full bg-emerald-500 text-white text-xs flex items-center justify-center"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Summary */}
        <div className={`p-4 border-t ${darkMode ? 'border-gray-800 bg-gray-900' : 'border-slate-200 bg-white'}`}>
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className={`text-xs ${colors.textSecondary}`}>Total Eco Points</p>
              <p className={`text-xl font-bold ${colors.text}`}>{totalPoints}</p>
            </div>
            <button
              type="button"
              onClick={clearCart}
              disabled={items.length === 0}
              className={`px-3 py-1 rounded-full text-xs border ${
                items.length === 0
                  ? 'opacity-50 cursor-not-allowed'
                  : darkMode
                    ? 'border-gray-700 text-gray-300'
                    : 'border-slate-300 text-slate-600'
              }`}
            >
              Clear cart
            </button>
          </div>
          <p className={`text-[11px] ${colors.textSecondary}`}>
            This cart is just for planning your DIY recycling projects. When you complete one, report it or share before/after photos in the app.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
