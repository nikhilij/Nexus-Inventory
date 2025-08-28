const sequelize = require('../config/sequelize');
const Category = require('./categoryModel');
const Product = require('./productModel');
const User = require('./userModel');

Category.hasMany(Product,{foreignKey:'categoryId',onDelete:'RESTRICT'});
Product.belongsTo(Category,{foreignKey:'categoryId'});

const syncDatabase = async () =>{
    try{
        let syncOptions = {};
        if(process.env.NODE_ENV === 'development'){
            syncOptions = {alter:true};
        }
        await sequelize.sync();
        console.log('✅ Database synchronized successfully.');
    } catch (error) {
        console.error('❌ Error synchronizing database:', error);
    }
}
syncDatabase();

module.exports = {
    sequelize,
    Category,
    Product,
    User
};