-- Create Supplements table
CREATE TABLE supplements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('Protein', 'Vitamins', 'Pre-workout', 'Recovery', 'Other')),
    stock_quantity INTEGER NOT NULL DEFAULT 0,
    price DECIMAL(10, 2) NOT NULL,
    reorder_threshold INTEGER NOT NULL DEFAULT 5,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create GymAccessories table
CREATE TABLE gym_accessories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('Straps', 'Belts', 'Bottles', 'Apparel', 'Other')),
    stock_quantity INTEGER NOT NULL DEFAULT 0,
    price DECIMAL(10, 2) NOT NULL,
    reorder_threshold INTEGER NOT NULL DEFAULT 5,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Store Transactions table
CREATE TABLE store_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL, -- Logical reference to either supplements or gym_accessories
    product_type TEXT NOT NULL CHECK (product_type IN ('Supplement', 'Accessory')),
    member_id UUID NOT NULL REFERENCES members(id),
    quantity INTEGER NOT NULL,
    total_price DECIMAL(10, 2) NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Set up Row Level Security
ALTER TABLE supplements ENABLE ROW LEVEL SECURITY;
ALTER TABLE gym_accessories ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_transactions ENABLE ROW LEVEL SECURITY;

-- Admins can manage everything
CREATE POLICY "Admins can full manage supplements" ON supplements FOR ALL USING (auth.role() = 'admin');
CREATE POLICY "Admins can full manage gym_accessories" ON gym_accessories FOR ALL USING (auth.role() = 'admin');
CREATE POLICY "Admins can view and manage transactions" ON store_transactions FOR ALL USING (auth.role() = 'admin');

-- Members can only read products and view their own transactions
CREATE POLICY "Members can read supplements" ON supplements FOR SELECT USING (true);
CREATE POLICY "Members can read gym_accessories" ON gym_accessories FOR SELECT USING (true);
CREATE POLICY "Members can view own transactions" ON store_transactions FOR SELECT USING (auth.uid() = member_id);
