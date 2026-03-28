-- Bump free tier from 50 to 500 monthly credits
-- Existing free-tier users get the upgrade immediately

UPDATE credit
SET balance = 500, "monthlyAllowance" = 500
WHERE plan = 'free' AND "monthlyAllowance" = 50;
