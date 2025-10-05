def twoSum(nums, target):
    # Create a hash map to store complements
    seen = {}
    
    # Iterate through the list
    for i in range(len(nums)):
        # Calculate the complement
        complement = target - nums[i]
        
        # If complement exists in map, we found a solution
        if complement in seen:
            return [seen[complement], i]
        
        # Add current number and its index to map
        seen[nums[i]] = i
    
    # No solution found
    return []

# Test the function
nums = [2, 7, 11, 15]
target = 9
result = twoSum(nums, target)
print(f"Indices: {result}")  # Should print [0, 1]
