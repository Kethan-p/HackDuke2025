from flask import Flask, render_template

app = Flask(__name__)

@app.route('/')
def index():
    # Define your location coordinates (for example, New York City)
    coordinates = {'lat': 40.7128, 'lng': -74.0060}
    return render_template('index.html', coordinates=coordinates)

if __name__ == '__main__':
    app.run(debug=True)
    
