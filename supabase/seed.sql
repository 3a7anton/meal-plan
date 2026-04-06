-- Seed data for the Office Meal Planning System
-- Run this after the initial migration

-- =====================
-- SEED MEALS
-- =====================

INSERT INTO meals (name, description, meal_type, dietary_tags, is_active) VALUES
  ('Continental Breakfast', 'Fresh croissants, butter, jam, and coffee', 'breakfast', ARRAY['Vegetarian'], true),
  ('American Breakfast', 'Eggs, bacon, toast, and hash browns', 'breakfast', NULL, true),
  ('Healthy Start', 'Oatmeal with fresh fruits, nuts, and honey', 'breakfast', ARRAY['Vegetarian', 'Vegan', 'Gluten-Free'], true),
  ('Avocado Toast', 'Smashed avocado on sourdough with poached eggs', 'breakfast', ARRAY['Vegetarian'], true),
  ('Pancake Stack', 'Fluffy pancakes with maple syrup and berries', 'breakfast', ARRAY['Vegetarian'], true),
  
  ('Grilled Chicken Salad', 'Mixed greens with grilled chicken, cherry tomatoes, and balsamic', 'lunch', ARRAY['Gluten-Free'], true),
  ('Vegetable Stir Fry', 'Seasonal vegetables with tofu in teriyaki sauce', 'lunch', ARRAY['Vegetarian', 'Vegan'], true),
  ('Classic Burger', 'Beef patty with lettuce, tomato, onion, and special sauce', 'lunch', NULL, true),
  ('Mediterranean Bowl', 'Falafel, hummus, tabbouleh, and pita bread', 'lunch', ARRAY['Vegetarian', 'Vegan', 'Halal'], true),
  ('Pasta Primavera', 'Penne with seasonal vegetables in marinara sauce', 'lunch', ARRAY['Vegetarian'], true),
  ('Fish Tacos', 'Grilled fish with cabbage slaw and chipotle mayo', 'lunch', NULL, true),
  ('Chicken Tikka Masala', 'Tender chicken in creamy tomato curry with rice', 'lunch', ARRAY['Halal', 'Gluten-Free'], true);

-- =====================
-- SEED SCHEDULES (Next 7 days)
-- =====================

-- Get meal IDs
DO $$
DECLARE
  meal_continental UUID;
  meal_american UUID;
  meal_healthy UUID;
  meal_avocado UUID;
  meal_pancake UUID;
  meal_chicken_salad UUID;
  meal_stir_fry UUID;
  meal_burger UUID;
  meal_mediterranean UUID;
  meal_pasta UUID;
  meal_fish_tacos UUID;
  meal_tikka UUID;
  current_date DATE := CURRENT_DATE;
  i INT;
BEGIN
  SELECT id INTO meal_continental FROM meals WHERE name = 'Continental Breakfast';
  SELECT id INTO meal_american FROM meals WHERE name = 'American Breakfast';
  SELECT id INTO meal_healthy FROM meals WHERE name = 'Healthy Start';
  SELECT id INTO meal_avocado FROM meals WHERE name = 'Avocado Toast';
  SELECT id INTO meal_pancake FROM meals WHERE name = 'Pancake Stack';
  SELECT id INTO meal_chicken_salad FROM meals WHERE name = 'Grilled Chicken Salad';
  SELECT id INTO meal_stir_fry FROM meals WHERE name = 'Vegetable Stir Fry';
  SELECT id INTO meal_burger FROM meals WHERE name = 'Classic Burger';
  SELECT id INTO meal_mediterranean FROM meals WHERE name = 'Mediterranean Bowl';
  SELECT id INTO meal_pasta FROM meals WHERE name = 'Pasta Primavera';
  SELECT id INTO meal_fish_tacos FROM meals WHERE name = 'Fish Tacos';
  SELECT id INTO meal_tikka FROM meals WHERE name = 'Chicken Tikka Masala';

  -- Create schedules for the next 7 days
  FOR i IN 0..6 LOOP
    -- Breakfast slots (8:00 AM and 9:00 AM)
    INSERT INTO menu_schedules (meal_id, scheduled_date, time_slot, capacity) VALUES
      (meal_continental, current_date + i, '08:00', 15),
      (meal_american, current_date + i, '08:00', 10),
      (meal_healthy, current_date + i, '09:00', 12),
      (meal_avocado, current_date + i, '09:00', 10);

    -- Lunch slots (12:00 PM and 1:00 PM)
    INSERT INTO menu_schedules (meal_id, scheduled_date, time_slot, capacity) VALUES
      (meal_chicken_salad, current_date + i, '12:00', 20),
      (meal_stir_fry, current_date + i, '12:00', 15),
      (meal_burger, current_date + i, '12:00', 15),
      (meal_mediterranean, current_date + i, '13:00', 15),
      (meal_pasta, current_date + i, '13:00', 15),
      (meal_tikka, current_date + i, '13:00', 12);
  END LOOP;
END $$;

-- Note: To create an admin user, first sign up through the app, 
-- then run this SQL (replace 'your-user-id' with the actual user ID):
-- UPDATE profiles SET role = 'admin' WHERE id = 'your-user-id';
