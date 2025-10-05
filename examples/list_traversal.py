def find_max_index(nums):
    # Initialize variables
    max_val = nums[0]
    max_idx = 0
    curr_idx = 1
    
    # Traverse the list
    while curr_idx < len(nums):
        if nums[curr_idx] > max_val:
            max_val = nums[curr_idx]
            max_idx = curr_idx
        curr_idx += 1
    
    return max_idx

# Test the function
nums = [3, 7, 1, 9, 4, 6]
result = find_max_index(nums)
print(f"Index of maximum value: {result}")  # Should print 3 (value 9)
