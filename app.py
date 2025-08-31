import logging
import os
import json
from datetime import datetime
from flask import Flask, render_template, request, redirect, url_for, jsonify, flash, session

app = Flask(__name__)
app.secret_key = os.environ.get("SESSION_SECRET", "food_ordering_system_secret_key")

# Data Storage
menu_items = []
customers = []
orders = []
order_items = []
next_menu_item_id = 1
next_customer_id = 1
next_order_id = 1
next_order_item_id = 1

class MenuItem:
    def __init__(self, name, description, price, category, image_url=None, is_available=True, location="Main Cafeteria", is_vegetarian=False, promotion=None):
        global next_menu_item_id
        self.id = next_menu_item_id
        next_menu_item_id += 1
        self.name = name
        self.description = description
        self.price = price
        self.category = category
        self.image_url = image_url
        self.is_available = is_available
        self.location = location
        self.is_vegetarian = is_vegetarian
        self.promotion = promotion
        
    def to_dict(self):
        return {k: v for k, v in self.__dict__.items()}

class Customer:
    def __init__(self, name, email, phone, address):
        global next_customer_id
        self.id = next_customer_id
        next_customer_id += 1
        self.name = name
        self.email = email
        self.phone = phone
        self.address = address
        
    def to_dict(self):
        return {k: v for k, v in self.__dict__.items()}

class Order:
    def __init__(self, customer_id, total_price, special_instructions=None):
        global next_order_id
        self.id = next_order_id
        next_order_id += 1
        self.customer_id = customer_id
        self.order_date = datetime.utcnow()
        self.total_price = total_price
        self.status = 'new'
        self.special_instructions = special_instructions
        
    def to_dict(self):
        return {
            'id': self.id,
            'customer_id': self.customer_id,
            'order_date': self.order_date.strftime('%Y-%m-%d %H:%M:%S'),
            'total_price': self.total_price,
            'status': self.status,
            'special_instructions': self.special_instructions
        }

class OrderItem:
    def __init__(self, order_id, menu_item_id, quantity, subtotal):
        global next_order_item_id
        self.id = next_order_item_id
        next_order_item_id += 1
        self.order_id = order_id
        self.menu_item_id = menu_item_id
        self.quantity = quantity
        self.subtotal = subtotal
        
    def to_dict(self):
        menu_item = get_menu_item_by_id(self.menu_item_id)
        return {
            'id': self.id,
            'menu_item': menu_item.to_dict() if menu_item else None,
            'quantity': self.quantity,
            'subtotal': self.subtotal
        }
def get_menu_items():
    return menu_items

def get_menu_item_by_id(menu_item_id):
    return next((item for item in menu_items if item.id == menu_item_id), None)

def get_customer_by_id(customer_id):
    return next((customer for customer in customers if customer.id == customer_id), None)

def get_order_by_id(order_id):
    return next((order for order in orders if order.id == order_id), None)

def get_order_items_by_order_id(order_id):
    return [item for item in order_items if item.order_id == order_id]

def initialize_menu_items():
    global menu_items
    if menu_items:
        return
    raw_items = [
        {
            "name": "masala Dosa",
            "description": "Crispy South Indian dosa served with chutney and sambar",
            "price": 40,
            "category": "South Indian",
            "location": "Main Cafeteria",
            "is_vegetarian": True,
            "image_url": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ9tXNH_xCEYOU9wjkNFLKfCHUf1mvc8QmR4g&s"
        },
        {
            "name": "Veg Fried Rice",
            "description": "Fried rice with vegetables and soy sauce",
            "price": 60,
            "category": "Chinese",
            "location": "Food Court",
            "is_vegetarian": True,
            "image_url": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSrG5ozMx8Xc_ONg4SxEAtSu3Ptu6pbSAXa9A&s"
        },
        {
            "name": "Egg Fried Rice",
            "description": "Fried rice with egg and vegetables",
            "price": 70,
            "category": "Chinese",
            "location": "Food Court",
            "is_vegetarian": False,
            "image_url": "https://www.allrecipes.com/thmb/GxHYGQD4Vh9BBu-EDlSv5XGBJNc=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc()/ALR-23298-egg-fried-rice-VAT-4x3-2closeup-ab653366830b41cc8d62627939ccc6c7.jpg"
        },
        {
            "name": "Veg Chowmein",
            "description": "Stir-fried noodles with veggies",
            "price": 50,
            "category": "Chinese",
            "location": "Main Cafeteria",
            "is_vegetarian": True,
            "image_url": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTQkXt4dNj9WmZ7f955QsY3E7nStyG0ni78XA&s"
        },
        {
            "name": "Egg Chowmein",
            "description": "Chowmein with scrambled egg",
            "price": 60,
            "category": "Chinese",
            "location": "Main Cafeteria",
            "is_vegetarian": False,
            "image_url": "https://c.ndtvimg.com/2020-07/53l0lr2_noodle_625x300_06_July_20.jpg"
        },
        {
            "name": "Soft Drink (Can)",
            "description": "Chilled carbonated beverage",
            "price": 30,
            "category": "Beverage",
            "location": "Food Court",
            "is_vegetarian": True,
            "image_url": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ941Y5G3iSYeqYcTXdiNxsELeqIgGudsL3eg&s"
        },
        {
            "name": "Boiled Egg",
            "description": "Protein-rich boiled egg",
            "price": 20,
            "category": "Snacks",
            "location": "Main Cafeteria",
            "is_vegetarian": False,
            "image_url": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSzFQlL9vmImw9iIt3QFyJgT-YE3wo7FeCfGA&s"
        },
        {
            "name": " Ice Cream",
            "description": "Classic vanilla cone",
            "price": 40,
            "category": "Dessert",
            "location": "Food Court",
            "is_vegetarian": True,
            "image_url": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQYFULypZgudRiujz0RZgtiT5R7Z2rilcdcBQ&s"
        },
        {
            "name": "Cheese Pizza",
            "description": "Cheesy pizza with tomato base",
            "price": 90,
            "category": "Fast Food",
            "location": "Food Court",
            "is_vegetarian": True,
            "image_url": "https://upload.wikimedia.org/wikipedia/commons/d/d3/Supreme_pizza.jpg"
        },
        {
            "name": "veg Burger",
            "description": "Burger with grilled chicken patty",
            "price": 80,
            "category": "Fast Food",
            "location": "Main Cafeteria",
            "is_vegetarian": True,
            "image_url": "https://www.indianhealthyrecipes.com/wp-content/uploads/2016/02/veg-burger-recipe-1.jpg"
        },
        {
            "name": "Samosa",
            "description": "Crispy fried potato-stuffed samosa",
            "price": 15,
            "category": "Snacks",
            "location": "Main Cafeteria",
            "is_vegetarian": True,
            "image_url": "https://vegecravings.com/wp-content/uploads/2017/03/Aloo-Samosa-Recipe-Step-By-Step-Instructions.jpg"
        }
    ]

    menu_items = [MenuItem(**item) for item in raw_items]


@app.route('/')
def index():
    if not menu_items:
        initialize_menu_items()
    featured = [item for item in menu_items if item.promotion][:3]
    return render_template('home.html', menu_items=menu_items, featured_items=featured)

@app.route('/menu')
def menu():
    initialize_menu_items()
    if not menu_items:
        logging.error("Menu items failed to load!")
    categories = sorted({item.category for item in menu_items})
    return render_template('menu.html', menu_items=menu_items, categories=categories)


@app.route('/order')
def order_page():
    if not menu_items:
        initialize_menu_items()
    categories = sorted({item.category for item in menu_items})
    return render_template('order.html', menu_items=menu_items, categories=categories)
@app.route('/submit-order', methods=['POST'])
def submit_order():
    try:
        data = request.get_json()

        # Extract customer details
        customer_name = data.get('customer_name', 'Anonymous')
        email = data.get('email', '')
        phone = data.get('phone', '')
        address = data.get('address', '')
        instructions = data.get('instructions', '')
        total = float(data.get('total', 0))

        # Parse items
        items = data.get('items')
        if isinstance(items, str):
            items = json.loads(items)
        elif not isinstance(items, list):
            return jsonify({'status': 'error', 'message': 'Invalid items format'}), 400

        if not items or not all('id' in item and 'quantity' in item for item in items):
            return jsonify({'status': 'error', 'message': 'Invalid order items'}), 400

        customer = Customer(customer_name, email, phone, address)
        customers.append(customer)
        order = Order(customer.id, total_price=total, special_instructions=instructions)
        orders.append(order)

        for item in items:
            menu_item = get_menu_item_by_id(item['id'])
            if not menu_item:
                continue  
            quantity = int(item['quantity'])
            subtotal = menu_item.price * quantity
            order_item = OrderItem(order.id, menu_item.id, quantity, subtotal)
            order_items.append(order_item)

        print(f"Order placed successfully: {order.to_dict()}")

        return jsonify({'status': 'success', 'redirect': url_for('order_confirmation', order_id=order.id)})

    except Exception as e:
        print(f"Error processing order: {e}")
        return jsonify({'status': 'error', 'message': str(e)}), 500
@app.route("/order/<int:order_id>")
def order_confirmation(order_id):
    order = get_order_by_id(order_id)
    if not order:
        return render_template("order_confirmation.html", order=None)

    customer = get_customer_by_id(order.customer_id)
    items = get_order_items_by_order_id(order.id)
    for item in items:
        item.menu_item = get_menu_item_by_id(item.menu_item_id)

    order.customer = customer
    order.items = items

    return render_template("order_confirmation.html", order=order)

@app.route('/orders')
def orders_list():
    sort_by = request.args.get('sort_by', 'order_date')
    direction = request.args.get('direction', 'desc')
    
    try:
        orders_data = []
        for order in orders:
            customer = get_customer_by_id(order.customer_id)
            items = get_order_items_by_order_id(order.id) or []
            
            orders_data.append({
                'id': order.id,
                'customer': {
                    'name': customer.name if customer else 'Unknown',
                    'phone': customer.phone if customer else 'N/A',
                    'email': customer.email if customer else '',
                    'address': customer.address if customer else ''
                },
                'order_date': order.order_date,
                'items': [{
                    'menu_item': get_menu_item_by_id(item.menu_item_id).to_dict() if get_menu_item_by_id(item.menu_item_id) else {},
                    'quantity': item.quantity,
                    'subtotal': item.subtotal
                } for item in items],
                'total_price': order.total_price,
                'status': order.status,
                'special_instructions': order.special_instructions
            })

        reverse_sort = (direction == 'desc')
        if sort_by == 'order_date':
            orders_data.sort(key=lambda x: x['order_date'], reverse=reverse_sort)
        elif sort_by == 'total_price':
            orders_data.sort(key=lambda x: x['total_price'], reverse=reverse_sort)
        elif sort_by == 'status':
            orders_data.sort(key=lambda x: x['status'], reverse=reverse_sort)

        return render_template('orderlist.html', 
                               orders=orders_data,
                               sort_by=sort_by,
                               direction=direction)
    
    except Exception as e:
        logging.error(f"Error loading orders: {str(e)}")
        flash('Error loading orders', 'error')
        return redirect(url_for('index'))

@app.route('/algorithm-visualization', endpoint='algorithm_visualization')
def algorithm_visualization():
    return render_template('algorithm_visualization.html', orders=orders)


@app.route('/api/menu/filter')
def filter_menu_items():
    initialize_menu_items()

    category = request.args.get('category')
    location = request.args.get('location')
    vegetarian = request.args.get('vegetarian')

    filtered = menu_items

    if category and category.lower() != 'all':
        filtered = [item for item in filtered if item.category == category]
    if location and location.lower() != 'all':
        filtered = [item for item in filtered if item.location == location]
    if vegetarian == 'true':
        filtered = [item for item in filtered if item.is_vegetarian]

    return jsonify([item.to_dict() for item in filtered])
@app.route('/api/optimize-order', methods=['POST'])
def optimize_orders():
    try:
        data = request.get_json()
        if not data:
            return jsonify({'success': False, 'error': 'No data provided'}), 400

        selected_order_ids = data.get('order_ids', [])
        capacity = data.get('capacity', 50)

        if not isinstance(selected_order_ids, list):
            return jsonify({'success': False, 'error': 'order_ids must be an array'}), 400

        if not isinstance(capacity, (int, float)) or capacity <= 0:
            return jsonify({'success': False, 'error': 'capacity must be a positive number'}), 400
        selected_orders = []
        for order in orders:
            if order.id in selected_order_ids:
                items = get_order_items_by_order_id(order.id)
                selected_orders.append({
                    'id': order.id,
                    'total_price': order.total_price,
                    'items_count': len(items),
                    'customer': get_customer_by_id(order.customer_id).name if get_customer_by_id(order.customer_id) else 'Unknown',
                    'date': order.order_date.strftime('%Y-%m-%d')
                })

        if not selected_orders:
            return jsonify({'success': False, 'error': 'No valid orders selected'}), 400
        n = len(selected_orders)
        W = int(capacity)
        dp = [[0] * (W + 1) for _ in range(n + 1)]

        for i in range(1, n + 1):
            weight = selected_orders[i - 1]['items_count']
            value = selected_orders[i - 1]['total_price']
            for w in range(W + 1):
                if weight <= w:
                    dp[i][w] = max(dp[i - 1][w], dp[i - 1][w - weight] + value)
                else:
                    dp[i][w] = dp[i - 1][w]
        w = W
        optimized_orders = []
        total_weight = 0

        for i in range(n, 0, -1):
            if dp[i][w] != dp[i - 1][w]:
                order = selected_orders[i - 1]
                optimized_orders.append(order)
                w -= order['items_count']
                total_weight += order['items_count']

        capacity_utilization = (total_weight / capacity) * 100 if capacity > 0 else 0

        return jsonify({
            'success': True,
            'optimized_orders': optimized_orders,
            'total_value': dp[n][W],
            'total_weight': total_weight,
            'capacity': capacity,
            'capacity_utilization': capacity_utilization
        })

    except Exception as e:
        app.logger.error(f"Error in optimize_orders: {str(e)}", exc_info=True)
        return jsonify({
            'success': False,
            'error': str(e),
            'message': 'Failed to run optimization'
        }), 500

if __name__ == '__main__':
    initialize_menu_items()
    app.run(debug=True)