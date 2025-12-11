import React from 'react';
import { useForm, Controller } from 'react-hook-form';
import styled from 'styled-components';
import { motion } from 'framer-motion';

const FormContainer = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const Label = styled.label`
  font-weight: 500;
  color: ${props => props.theme.colors.gray[700]};
  font-size: 0.9rem;
`;

const Input = styled.input`
  padding: 0.75rem;
  border: 1px solid ${props => props.hasError ? props.theme.colors.error : props.theme.colors.border};
  border-radius: 4px;
  font-size: 1rem;
  transition: border-color 0.2s;

  &:focus {
    outline: none;
    border-color: ${props => props.hasError ? props.theme.colors.error : props.theme.colors.primary};
  }
`;

const TextArea = styled.textarea`
  padding: 0.75rem;
  border: 1px solid ${props => props.hasError ? props.theme.colors.error : props.theme.colors.border};
  border-radius: 4px;
  font-size: 1rem;
  min-height: 100px;
  resize: vertical;
  font-family: inherit;
  transition: border-color 0.2s;

  &:focus {
    outline: none;
    border-color: ${props => props.hasError ? props.theme.colors.error : props.theme.colors.primary};
  }
`;

const Select = styled.select`
  padding: 0.75rem;
  border: 1px solid ${props => props.hasError ? props.theme.colors.error : props.theme.colors.border};
  border-radius: 4px;
  font-size: 1rem;
  background: white;
  transition: border-color 0.2s;

  &:focus {
    outline: none;
    border-color: ${props => props.hasError ? props.theme.colors.error : props.theme.colors.primary};
  }
`;

const ErrorMessage = styled(motion.span)`
  color: ${props => props.theme.colors.error};
  font-size: 0.8rem;
  margin-top: 0.25rem;
`;

const TagsContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 0.5rem;
`;

const Tag = styled.span`
  background: ${props => props.theme.colors.primary};
  color: white;
  padding: 0.25rem 0.5rem;
  border-radius: 12px;
  font-size: 0.8rem;
  display: flex;
  align-items: center;
  gap: 0.25rem;
`;

const TagRemoveButton = styled.button`
  background: none;
  border: none;
  color: white;
  cursor: pointer;
  font-size: 0.7rem;
  padding: 0;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    background: rgba(255, 255, 255, 0.2);
  }
`;

const TagInput = styled.input`
  padding: 0.5rem;
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: 4px;
  font-size: 0.9rem;
  flex: 1;
  min-width: 200px;
`;

const categories = [
  'Electronics',
  'Books',
  'Clothing',
  'Home',
  'Sports',
  'Beauty'
];

const ProductForm = ({ initialData, onSubmit, loading = false }) => {
  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors }
  } = useForm({
    defaultValues: {
      name: initialData?.name || '',
      description: initialData?.description || '',
      price: initialData?.price || '',
      category: initialData?.category || '',
      brand: initialData?.brand || '',
      tags: initialData?.tags || [],
      inventory: {
        quantity: initialData?.inventory?.quantity || 0,
      },
      ...initialData
    }
  });

  const watchedTags = watch('tags');
  const [tagInput, setTagInput] = React.useState('');

  const addTag = () => {
    if (tagInput.trim() && !watchedTags.includes(tagInput.trim())) {
      setValue('tags', [...watchedTags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove) => {
    setValue('tags', watchedTags.filter(tag => tag !== tagToRemove));
  };

  const handleTagInputKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag();
    }
  };

  return (
    <FormContainer onSubmit={handleSubmit(onSubmit)}>
      <FormGroup>
        <Label htmlFor="name">Product Name *</Label>
        <Input
          id="name"
          {...register('name', { 
            required: 'Product name is required',
            minLength: { value: 2, message: 'Name must be at least 2 characters' }
          })}
          hasError={!!errors.name}
          placeholder="Enter product name"
        />
        {errors.name && (
          <ErrorMessage
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {errors.name.message}
          </ErrorMessage>
        )}
      </FormGroup>

      <FormGroup>
        <Label htmlFor="description">Description</Label>
        <TextArea
          id="description"
          {...register('description')}
          hasError={!!errors.description}
          placeholder="Enter product description"
        />
      </FormGroup>

      <FormGroup>
        <Label htmlFor="price">Price *</Label>
        <Input
          id="price"
          type="number"
          step="0.01"
          {...register('price', { 
            required: 'Price is required',
            min: { value: 0, message: 'Price must be positive' }
          })}
          hasError={!!errors.price}
          placeholder="0.00"
        />
        {errors.price && (
          <ErrorMessage
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {errors.price.message}
          </ErrorMessage>
        )}
      </FormGroup>

      <FormGroup>
        <Label htmlFor="category">Category *</Label>
        <Select
          id="category"
          {...register('category', { required: 'Category is required' })}
          hasError={!!errors.category}
        >
          <option value="">Select a category</option>
          {categories.map(category => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </Select>
        {errors.category && (
          <ErrorMessage
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {errors.category.message}
          </ErrorMessage>
        )}
      </FormGroup>

      <FormGroup>
        <Label htmlFor="brand">Brand</Label>
        <Input
          id="brand"
          {...register('brand')}
          placeholder="Enter brand name"
        />
      </FormGroup>

      <FormGroup>
        <Label htmlFor="quantity">Inventory Quantity</Label>
        <Input
          id="quantity"
          type="number"
          {...register('inventory.quantity', { 
            min: { value: 0, message: 'Quantity cannot be negative' }
          })}
          hasError={!!errors.inventory?.quantity}
          placeholder="0"
        />
        {errors.inventory?.quantity && (
          <ErrorMessage
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {errors.inventory.quantity.message}
          </ErrorMessage>
        )}
      </FormGroup>

      <FormGroup>
        <Label>Tags</Label>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <TagInput
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyPress={handleTagInputKeyPress}
            placeholder="Add a tag and press Enter"
          />
          <button
            type="button"
            onClick={addTag}
            style={{
              padding: '0.5rem 1rem',
              background: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Add
          </button>
        </div>
        <TagsContainer>
          {watchedTags.map((tag, index) => (
            <Tag key={index}>
              {tag}
              <TagRemoveButton
                type="button"
                onClick={() => removeTag(tag)}
              >
                ×
              </TagRemoveButton>
            </Tag>
          ))}
        </TagsContainer>
      </FormGroup>
    </FormContainer>
  );
};

export default ProductForm;