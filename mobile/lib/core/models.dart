class EventModel {
  final int id;
  final String title;
  final String description;
  final String venue;
  final DateTime eventDate;
  final int? createdById;
  final String? createdByName;

  EventModel({
    required this.id,
    required this.title,
    required this.description,
    required this.venue,
    required this.eventDate,
    this.createdById,
    this.createdByName,
  });

  factory EventModel.fromJson(Map<String, dynamic> json) {
    return EventModel(
      id: json['id'] as int,
      title: json['title'] as String? ?? 'Untitled Event',
      description: json['description'] as String? ?? '',
      venue: json['venue'] as String? ?? 'TBA',
      eventDate: DateTime.tryParse(json['eventDate'] as String? ?? '') ?? DateTime.now(),
      createdById: json['createdById'] as int?,
      createdByName: json['createdByName'] as String?,
    );
  }
}

class RegistrationModel {
  final int id;
  final int eventId;
  final String eventTitle;
  final String eventVenue;
  final DateTime eventDate;
  final DateTime registeredAt;

  RegistrationModel({
    required this.id,
    required this.eventId,
    required this.eventTitle,
    required this.eventVenue,
    required this.eventDate,
    required this.registeredAt,
  });

  factory RegistrationModel.fromJson(Map<String, dynamic> json) {
    return RegistrationModel(
      id: json['id'] as int,
      eventId: json['eventId'] as int,
      eventTitle: json['eventTitle'] as String? ?? 'Campus Event',
      eventVenue: json['eventVenue'] as String? ?? '',
      eventDate: DateTime.tryParse(json['eventDate'] as String? ?? '') ?? DateTime.now(),
      registeredAt: DateTime.tryParse(json['registeredAt'] as String? ?? '') ?? DateTime.now(),
    );
  }
}
