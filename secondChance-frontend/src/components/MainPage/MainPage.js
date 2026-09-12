import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { urlConfig } from '../../config';
import { useAppContext } from '../../context/AppContext';

function MainPage() {
    const [items, setItems] = useState([]);
    const navigate = useNavigate();
    const { isLoggedIn } = useAppContext();

    useEffect(() => {
        const fetchItems = async () => {
            try {
                const url = `${urlConfig.backendUrl}/api/secondchance/items`;
                const response = await fetch(url);
                if (!response.ok) {
                    throw new Error(`HTTP error; ${response.status}`);
                }
                const data = await response.json();
                setItems(data);
            } catch (error) {
                console.log('Fetch error: ' + error.message);
            }
        };

        fetchItems();
    }, []);

    const goToDetailsPage = (itemId) => {
        navigate(`/app/item/${itemId}`);
    };

    const handleAddItem = () => {
        navigate('/app/addItem');
    };

    const handleGetStarted = () => {
        navigate(isLoggedIn ? '/app' : '/app/register');
    };

    const formatDate = (timestamp) => {
        const date = new Date(timestamp * 1000);
        return date.toLocaleString('default', { month: 'long', day: 'numeric', year: 'numeric' });
    };

    const getConditionClass = (condition) => {
        return condition === 'New' ? 'list-group-item-success' : 'list-group-item-warning';
    };

    return (
        <div className="container mt-4">
            <section className="text-center py-5 mb-4">
                <h1 className="display-4 fw-bold">SecondChance</h1>
                <p className="lead mx-auto" style={{ maxWidth: '720px' }}>
                    Give useful household items a second life. Share what you no longer need and discover free items ready to be reused.
                </p>
                <button className="btn btn-primary btn-lg mt-2" onClick={handleGetStarted}>
                    Get Started
                </button>
            </section>

            {isLoggedIn && (
                <div className="mb-4">
                    <button className="btn btn-success" onClick={handleAddItem}>Add Item</button>
                </div>
            )}

            <div className="row">
                {items.map((item) => (
                    <div key={item.id} className="col-md-4 mb-4">
                        <div className="card product-card">
                            <div className="image-placeholder">
                                {item.image ? (
                                    <img src={urlConfig.backendUrl + item.image} alt={item.name} />
                                ) : (
                                    <div className="no-image-available">No Image Available</div>
                                )}
                            </div>
                            <div className="card-body">
                                <h5 className="card-title">{item.name}</h5>
                                <p className={`card-text ${getConditionClass(item.condition)}`}>
                                    {item.condition}
                                </p>
                                <p className="card-text date-added">
                                    {formatDate(item.date_added)}
                                </p>
                            </div>
                            <div className="card-footer">
                                <button onClick={() => goToDetailsPage(item.id)} className="btn btn-primary w-100">
                                    View Details
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default MainPage;
