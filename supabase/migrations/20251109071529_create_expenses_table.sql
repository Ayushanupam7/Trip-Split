/*
  # Trip Expense Tracker Schema

  ## Overview
  Creates the expenses table to track all trip-related expenses for groups of friends.

  ## New Tables
  - `expenses`
    - `id` (uuid, primary key) - Unique identifier for each expense
    - `payer` (text) - Name of the person who paid for the expense
    - `category` (text) - Category of expense (e.g., 'Food', 'Travel', 'Hotel', 'Tickets')
    - `amount` (numeric) - Amount spent on the expense
    - `description` (text) - Description of the expense
    - `date` (timestamptz) - Date when the expense occurred
    - `created_at` (timestamptz) - Timestamp when the record was created

  ## Security
  - Enable RLS on `expenses` table
  - Add policy to allow anyone to read all expenses (suitable for shared trip tracking)
  - Add policy to allow anyone to insert new expenses
  - Add policy to allow anyone to update expenses
  - Add policy to allow anyone to delete expenses

  ## Notes
  - For this collaborative trip tracker, we're using permissive policies since all friends need full access
  - In a production app with authentication, you would restrict these policies to authenticated users only
*/

CREATE TABLE IF NOT EXISTS expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  payer text NOT NULL,
  category text NOT NULL,
  amount numeric NOT NULL CHECK (amount >= 0),
  description text DEFAULT '',
  date timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view expenses"
  ON expenses
  FOR SELECT
  USING (true);

CREATE POLICY "Anyone can insert expenses"
  ON expenses
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update expenses"
  ON expenses
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anyone can delete expenses"
  ON expenses
  FOR DELETE
  USING (true);