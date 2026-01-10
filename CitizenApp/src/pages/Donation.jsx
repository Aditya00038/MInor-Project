import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { collection, addDoc, getDocs, query, where, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../firebase/config';
import { Heart, ShoppingCart, Plus, X, MapPin, User, Filter } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Donation() {
  const { currentUser } = useAuth();
  const [items, setItems] = useState([]);
  const [userItems, setUserItems] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [cartItems, setCartItems] = useState([]);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    condition: 'good',
    image: null
  });
  const [preview, setPreview] = useState(null);

  const categories = [
    'Electronics',
    'Clothing',
    'Furniture',
    'Books',
    'Toys',
    'Sports',
    'Kitchen',
    'Home Decor',
    'Other'
  ];

  useEffect(() => {
    fetchItems();
  }, [filter]);

  async function fetchItems() {
    try {
      const q = collection(db, 'donations');
      const querySnapshot = await getDocs(q);
      
      const itemsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setItems(itemsData);
    } catch (error) {
      console.error('Error fetching items:', error);
    }
  }

  function handleFormChange(e) {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  }

  function handleImageChange(e) {
    const file = e.target.files[0];
    if (file) {
      setFormData(prev => ({ ...prev, image: file }));
      const reader = new FileReader();
      reader.onload = (evt) => setPreview(evt.target.result);
      reader.readAsDataURL(file);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);

    try {
      let imageUrl = '';
      
      if (formData.image) {
        const storageRef = ref(storage, `donations/${Date.now()}_${formData.image.name}`);
        await uploadBytes(storageRef, formData.image);
        imageUrl = await getDownloadURL(storageRef);
      }

      await addDoc(collection(db, 'donations'), {
        ...formData,
        image: imageUrl,
        userId: currentUser.uid,
        userEmail: currentUser.email,
        userName: currentUser.displayName || 'Anonymous',
        status: 'available',
        createdAt: serverTimestamp()
      });

      setFormData({
        title: '',
        description: '',
        category: '',
        condition: 'good',
        image: null
      });
      setPreview(null);
      setShowForm(false);
      fetchItems();
    } catch (error) {
      console.error('Error adding item:', error);
      alert('Failed to add item');
    }
    setLoading(false);
  }

  function addToCart(item) {
    setCartItems([...cartItems, item]);
  }

  function removeFromCart(itemId) {
    setCartItems(cartItems.filter(item => item.id !== itemId));
  }

  const filteredItems = items.filter(item => {
    if (item.userId === currentUser?.uid) return false; // Don't show user's own items
    if (filter !== 'all' && item.category !== filter) return false;
    if (searchTerm && !item.title.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 pt-20 pb-12 px-4"
    >
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-7xl mx-auto"
      >
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
              Community Donations
            </h1>
            <p className="text-gray-600 text-lg">Give and Get - Share items with your community</p>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowForm(!showForm)}
            className="mt-4 md:mt-0 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-bold rounded-xl hover:shadow-lg transition-all flex items-center gap-2"
          >
            <Plus size={20} />
            Donate an Item
          </motion.button>
        </div>

        {/* Add Item Form */}
        {showForm && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl shadow-xl p-8 mb-8"
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Add Item to Donate</h2>
              <button
                onClick={() => setShowForm(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={28} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-lg font-semibold text-gray-700 mb-2">
                    Item Title *
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleFormChange}
                    placeholder="e.g., Vintage Wooden Chair"
                    required
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-lg font-semibold text-gray-700 mb-2">
                    Category *
                  </label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleFormChange}
                    required
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-600 focus:outline-none"
                  >
                    <option value="">Select category</option>
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-lg font-semibold text-gray-700 mb-2">
                  Description *
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleFormChange}
                  placeholder="Describe the item, its condition, and why you're donating it..."
                  rows="4"
                  required
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-600 focus:outline-none resize-none"
                />
              </div>

              <div>
                <label className="block text-lg font-semibold text-gray-700 mb-2">
                  Item Condition *
                </label>
                <select
                  name="condition"
                  value={formData.condition}
                  onChange={handleFormChange}
                  required
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-600 focus:outline-none"
                >
                  <option value="like-new">Like New</option>
                  <option value="good">Good</option>
                  <option value="fair">Fair</option>
                  <option value="need-repair">Needs Repair</option>
                </select>
              </div>

              <div>
                <label className="block text-lg font-semibold text-gray-700 mb-2">
                  Upload Image
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl"
                />
                {preview && (
                  <img src={preview} alt="Preview" className="mt-4 w-32 h-32 object-cover rounded-lg" />
                )}
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold rounded-xl hover:shadow-lg transition-all disabled:opacity-50"
              >
                {loading ? 'Adding...' : 'Add Item to Donations'}
              </motion.button>
            </form>
          </motion.div>
        )}

        {/* Search and Filter */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex flex-col md:flex-row gap-4 mb-8"
        >
          <input
            type="text"
            placeholder="Search items..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-600 focus:outline-none"
          />
          
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-600 focus:outline-none"
          >
            <option value="all">All Categories</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>

          <div className="relative">
            <motion.button
              whileHover={{ scale: 1.05 }}
              className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-all flex items-center gap-2 relative"
            >
              <ShoppingCart size={20} />
              Cart ({cartItems.length})
            </motion.button>
          </div>
        </motion.div>

        {/* Items Grid */}
        {filteredItems.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <Heart size={48} className="mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600 text-lg">No items available right now</p>
          </motion.div>
        ) : (
          <motion.div
            layout
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {filteredItems.map((item, index) => (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ y: -5 }}
                className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition-all"
              >
                {/* Image */}
                <div className="relative h-48 bg-gradient-to-br from-blue-200 to-purple-200 overflow-hidden">
                  {item.image ? (
                    <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-4xl">📦</div>
                  )}
                  <div className="absolute top-3 right-3 bg-green-600 text-white px-3 py-1 rounded-full text-sm font-bold">
                    {item.condition}
                  </div>
                </div>

                {/* Content */}
                <div className="p-6 space-y-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-semibold text-purple-600 bg-purple-100 px-2 py-1 rounded-full">
                        {item.category}
                      </span>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{item.title}</h3>
                    <p className="text-gray-600 text-sm line-clamp-2">{item.description}</p>
                  </div>

                  {/* User Info */}
                  <div className="flex items-center gap-3 text-sm text-gray-600 border-t pt-3">
                    <User size={16} />
                    <span className="font-semibold">{item.userName}</span>
                  </div>

                  {/* Action Buttons */}
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => addToCart(item)}
                    className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold rounded-xl hover:shadow-lg transition-all flex items-center justify-center gap-2"
                  >
                    <Heart size={20} />
                    Add to Wishlist
                  </motion.button>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Info Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          <div className="bg-blue-50 border-l-4 border-blue-600 rounded-lg p-6">
            <h3 className="font-bold text-blue-900 mb-3">♻️ How It Works</h3>
            <ul className="text-blue-800 space-y-2 text-sm">
              <li>✓ List your items</li>
              <li>✓ Browse community items</li>
              <li>✓ Add to wishlist</li>
              <li>✓ Contact donors</li>
            </ul>
          </div>

          <div className="bg-green-50 border-l-4 border-green-600 rounded-lg p-6">
            <h3 className="font-bold text-green-900 mb-3">🌍 Benefits</h3>
            <ul className="text-green-800 space-y-2 text-sm">
              <li>✓ Reduce waste</li>
              <li>✓ Help community</li>
              <li>✓ Save money</li>
              <li>✓ Build connections</li>
            </ul>
          </div>

          <div className="bg-purple-50 border-l-4 border-purple-600 rounded-lg p-6">
            <h3 className="font-bold text-purple-900 mb-3">💡 Tips</h3>
            <ul className="text-purple-800 space-y-2 text-sm">
              <li>✓ Add clear photos</li>
              <li>✓ Describe condition</li>
              <li>✓ Be honest & kind</li>
              <li>✓ Meet safely</li>
            </ul>
          </div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
